import os
import shutil
import uuid
import re
import boto3
import ffmpeg
from pathlib import Path
from typing import Optional

# Added 'Form' to imports
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# ==========================================
# 1. CONFIGURATION
# ==========================================

origins = [
    "http://localhost:3000",
    "https://folklorico-app.vercel.app", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

s3_client = boto3.client(
    service_name='s3',
    endpoint_url=f"https://{os.getenv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
    aws_access_key_id=os.getenv('R2_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('R2_SECRET_ACCESS_KEY'),
    region_name="auto",
)

R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME")
# Ensure we don't have double slashes if the env var ends in /
R2_PUBLIC_DOMAIN = os.getenv("R2_PUBLIC_DOMAIN", "").rstrip("/")

TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)

# ==========================================
# 2. HELPER FUNCTIONS
# ==========================================

def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")
    try:
        token = authorization.split(" ")[1]
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid Token")
        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication Failed: {str(e)}")

def sanitize_filename(title: str) -> str:
    """Converts 'El Son de la Negra' to 'el_son_de_la_negra'."""
    # Lowercase, replace spaces with underscores, remove non-alphanumeric
    clean = re.sub(r'[^a-z0-9_]', '', title.lower().replace(" ", "_"))
    return clean

def save_upload_file_tmp(upload_file: UploadFile, title: str) -> Path:
    """Save upload to temp with optimized naming convention."""
    try:
        file_extension = upload_file.filename.split(".")[-1]
        clean_title = sanitize_filename(title)
        # Naming Format: optimized_title_shortuuid.ext
        short_id = str(uuid.uuid4())[:8]
        new_filename = f"optimized_{clean_title}_{short_id}.{file_extension}"
        
        temp_path = TEMP_DIR / new_filename
        
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
            
        return temp_path
    finally:
        upload_file.file.close()

def generate_thumbnail(video_path: Path) -> Optional[Path]:
    thumb_path = video_path.with_suffix(".jpg")
    try:
        (
            ffmpeg
            .input(str(video_path), ss=1)
            .filter('scale', 800, -1)
            .output(str(thumb_path), vframes=1)
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        return thumb_path
    except Exception as e:
        print(f"Thumbnail Generation Error: {str(e)}")
        return None

def convert_video_to_mp4(input_path: Path) -> Optional[Path]:
    output_path = input_path.with_suffix(".mp4")
    try:
        (
            ffmpeg
            .input(str(input_path))
            .output(
                str(output_path), 
                vcodec='libx264', 
                acodec='aac', 
                strict='experimental',
                preset='fast',
                movflags='+faststart'
            )
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        return output_path
    except Exception as e:
        print(f"Video Conversion Error: {str(e)}")
        return None

def convert_audio_to_m4a(input_path: Path) -> Optional[Path]:
    output_path = input_path.with_suffix(".m4a")
    try:
        (
            ffmpeg
            .input(str(input_path))
            .output(
                str(output_path),
                acodec='aac',
                audio_bitrate='192k'
            )
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        return output_path
    except Exception as e:
        print(f"Audio Conversion Error: {str(e)}")
        return None

def upload_file_to_r2(file_path: Path, content_type: str, folder: str) -> str:
    file_name = file_path.name
    object_key = f"{folder}/{file_name}"
    
    try:
        s3_client.upload_file(
            str(file_path),
            R2_BUCKET_NAME,
            object_key,
            ExtraArgs={
                'ContentType': content_type,
                'ACL': 'public-read'
            }
        )
        
        # --- FIX FOR PLAYBACK ISSUES ---
        # Ensure the domain has https:// prefix
        domain = R2_PUBLIC_DOMAIN
        if not domain.startswith("http"):
            domain = f"https://{domain}"
            
        return f"{domain}/{object_key}"
        
    except Exception as e:
        raise Exception(f"Failed to upload {file_name} to R2: {str(e)}")

# ==========================================
# 3. ENDPOINTS
# ==========================================

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Folklorico Backend Active"}

@app.post("/upload/convert")
async def upload_and_process(
    file: UploadFile = File(...),
    # We now accept 'title' from the form data
    title: str = Form(...),
    user=Depends(get_current_user)
):
    temp_file_path = None
    converted_path = None
    thumb_path = None
    
    try:
        # 1. Save raw file with NEW NAMING CONVENTION
        temp_file_path = save_upload_file_tmp(file, title)
        final_upload_path = temp_file_path
        final_content_type = file.content_type
        folder_name = "misc"
        
        is_video = file.content_type.startswith("video")
        is_audio = file.content_type.startswith("audio")
        
        thumbnail_url = None

        # 3A. Handle VIDEO -> Folder: "mp4"
        if is_video:
            thumb_path = generate_thumbnail(temp_file_path)
            if thumb_path and thumb_path.exists():
                thumbnail_url = upload_file_to_r2(thumb_path, "image/jpeg", "thumbnails")
            
            converted_path = convert_video_to_mp4(temp_file_path)
            if converted_path and converted_path.exists():
                final_upload_path = converted_path
                final_content_type = "video/mp4"
            
            folder_name = "mp4"

        # 3B. Handle AUDIO -> Folder: "m4a"
        elif is_audio:
            converted_path = convert_audio_to_m4a(temp_file_path)
            if converted_path and converted_path.exists():
                final_upload_path = converted_path
                final_content_type = "audio/mp4" 
            
            folder_name = "m4a"

        # 4. Upload Final File
        public_url = upload_file_to_r2(final_upload_path, final_content_type, folder_name)

        return {
            "public_url": public_url,
            "thumbnail_url": thumbnail_url,
            "message": "Upload and processing successful"
        }

    except Exception as e:
        print(f"Processing Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        for path in [temp_file_path, converted_path, thumb_path]:
            try:
                if path and path.exists():
                    os.remove(path)
            except:
                pass

@app.delete("/media/{media_id}")
async def delete_media(media_id: str, user=Depends(get_current_user)):
    try:
        # 1. Fetch BOTH file_path and thumbnail_url from the DB
        data = supabase.table("media_items").select("file_path", "thumbnail_url").eq("id", media_id).execute()
        
        if data.data and len(data.data) > 0:
            item = data.data[0]
            
            # Define a helper to safely delete any URL from R2
            def delete_from_r2(url_string):
                if url_string and R2_PUBLIC_DOMAIN in url_string:
                    # Clean the URL to get the object key (e.g. "thumbnails/image.jpg")
                    # We strip the domain and any leading slashes
                    clean_domain = R2_PUBLIC_DOMAIN.rstrip("/")
                    object_key = url_string.replace(f"{clean_domain}/", "")
                    
                    print(f"Attempting to delete R2 object: {object_key}")
                    try:
                        s3_client.delete_object(Bucket=R2_BUCKET_NAME, Key=object_key)
                    except Exception as boto_err:
                        print(f"Warning: R2 deletion failed for {object_key}: {boto_err}")

            # Delete the Main Media File
            delete_from_r2(item.get("file_path"))
            
            # Delete the Thumbnail (Directly from DB value - no guessing!)
            delete_from_r2(item.get("thumbnail_url"))

        # 2. Delete the record from Supabase
        supabase.table("media_items").delete().eq("id", media_id).execute()
        
        return {"message": "Media and thumbnail deleted successfully"}

    except Exception as e:
        # Log the error but don't crash the user experience if possible
        print(f"Delete Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, user=Depends(get_current_user)):
    try:
        supabase.auth.admin.delete_user(user_id)
        return {"message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)