from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
import os
import shutil
import ffmpeg
import uuid
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv()

# 2. Setup Supabase Client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# 3. Initialize FastAPI
app = FastAPI()
security = HTTPBearer() # <--- Security Scheme

# 4. Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SECURITY DEPENDENCY ---
# This function runs before the main route logic
def verify_admin_or_teacher(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # A. Verify the Token with Supabase Auth
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
             raise HTTPException(status_code=401, detail="Invalid authentication token")
        
        user_id = user_response.user.id

        # B. Check Role in Database
        # We query the 'profiles' table to see if this user is allowed
        response = supabase.table("profiles").select("role").eq("id", user_id).single().execute()
        
        if not response.data:
             raise HTTPException(status_code=401, detail="User profile not found")
             
        role = response.data.get("role")
        
        # C. Enforce Policy
        if role not in ["admin", "teacher"]:
            raise HTTPException(status_code=403, detail="Not authorized to perform this action")
            
        return user_id

    except Exception as e:
        # If anything fails (token expired, network error), block access
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")

# --- HELPER FUNCTIONS ---

def get_storage_path(full_url: str):
    if not full_url:
        return None
    try:
        parts = full_url.split("/media/")
        if len(parts) > 1:
            return parts[1]
    except Exception:
        pass
    return None

# --- ROUTES ---

@app.get("/")
def read_root():
    return {"message": "Hola! The Folklorico API is running."}

# PROTECTED: Upload Route
@app.post("/upload/convert")
async def convert_and_upload(
    file: UploadFile = File(...),
    # The 'user_id' argument triggers the security check defined above
    user_id: str = Depends(verify_admin_or_teacher) 
):
    """
    Secure upload endpoint. Only admins/teachers can pass the check.
    """
    
    # 1. Generate Unique Identifiers
    unique_id = str(uuid.uuid4())[:8]
    original_base = file.filename.split('.')[0]
    base_name = f"{original_base}_{unique_id}"
    temp_input = f"temp_{unique_id}_{file.filename}"
    
    # 2. Save Input File Locally
    with open(temp_input, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 3. Configure Conversion Settings
    if "audio" in file.content_type:
        output_ext = "m4a"
        content_type = "audio/mp4"
        conversion_args = {
            'format': 'ipod',
            'acodec': 'aac',
            'audio_bitrate': '192k' 
        }
        thumb_output = None
    else:
        output_ext = "mp4"
        content_type = "video/mp4"
        conversion_args = {
            'format': 'mp4',
            'vcodec': 'libx264',
            'acodec': 'aac',
            'crf': 28,
            'preset': 'veryfast',
            'movflags': '+faststart',
            'pix_fmt': 'yuv420p'
        }
        thumb_output = f"thumb_{base_name}.jpg"

    media_output = f"optimized_{base_name}.{output_ext}"
    
    try:
        thumb_url = None
        
        # 4. Generate & Upload Thumbnail
        if thumb_output:
            try:
                (
                    ffmpeg
                    .input(temp_input, ss=1)
                    .filter('scale', 640, -1)
                    .output(thumb_output, vframes=1)
                    .run(quiet=True, overwrite_output=True)
                )
                with open(thumb_output, "rb") as f:
                    supabase.storage.from_("media").upload(
                        path=f"thumbnails/{thumb_output}",
                        file=f.read(),
                        file_options={"content-type": "image/jpeg"}
                    )
                thumb_url = supabase.storage.from_("media").get_public_url(f"thumbnails/{thumb_output}")
            except Exception as e:
                print(f"Thumbnail generation failed: {e}")

        # 5. Convert Main Media
        stream = ffmpeg.input(temp_input)
        stream = ffmpeg.output(stream, media_output, **conversion_args)
        ffmpeg.run(stream, overwrite_output=True)

        # 6. Upload Main Media
        with open(media_output, "rb") as f:
            storage_path = f"{output_ext}/{os.path.basename(media_output)}"
            supabase.storage.from_("media").upload(
                path=storage_path,
                file=f.read(),
                file_options={"content-type": content_type}
            )

        public_url = supabase.storage.from_("media").get_public_url(storage_path)

        return {
            "status": "success",
            "public_url": public_url,
            "thumbnail_url": thumb_url
        }

    except Exception as e:
        print(f"Conversion Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Cleanup
        paths_to_clean = [temp_input, media_output]
        if 'thumb_output' in locals() and thumb_output:
            paths_to_clean.append(thumb_output)
            
        for p in paths_to_clean:
            if p and os.path.exists(p):
                try:
                    os.remove(p)
                except Exception:
                    pass

# PROTECTED: Delete Route
@app.delete("/media/{media_id}")
async def delete_media(
    media_id: str,
    user_id: str = Depends(verify_admin_or_teacher) # <--- Lock it down
):
    try:
        # Fetch metadata
        response = supabase.table("media_items").select("*").eq("id", media_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
            
        item = response.data[0]
        files_to_remove = []
        
        main_path = get_storage_path(item.get("file_path"))
        if main_path: files_to_remove.append(main_path)
            
        thumb_path = get_storage_path(item.get("thumbnail_url"))
        if thumb_path: files_to_remove.append(thumb_path)
            
        if files_to_remove:
            supabase.storage.from_("media").remove(files_to_remove)
            
        # Delete Database Row
        supabase.table("media_items").delete().eq("id", media_id).execute()
        
        return {"status": "success", "deleted_id": media_id}

    except Exception as e:
        print(f"Delete Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))