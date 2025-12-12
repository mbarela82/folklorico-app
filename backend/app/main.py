from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import os
import shutil
import ffmpeg
import uuid
from dotenv import load_dotenv

# 1. Load Environment Variables
load_dotenv()

# 2. Setup Supabase Client
# Ensure SUPABASE_KEY in .env is your SERVICE_ROLE key (starts with eyJ...)
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# 3. Initialize FastAPI
app = FastAPI()

# 4. Setup CORS
# This allows your Next.js app (running on localhost:3000) to send requests here.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- HELPER FUNCTIONS ---

def get_storage_path(full_url: str):
    """
    Extracts the storage path (e.g. 'video/dance.mp4') from a full public URL.
    Returns None if the URL is invalid or empty.
    """
    if not full_url:
        return None
    try:
        # Split by the bucket name "media"
        # Example URL: https://xyz.supabase.co/storage/v1/object/public/media/video/file.mp4
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

@app.get("/test-db")
def test_db():
    # Simple check to ensure DB connection is active
    response = supabase.table("profiles").select("*").execute()
    return response

@app.post("/upload/convert")
async def convert_and_upload(file: UploadFile = File(...)):
    """
    Receives raw media, generates unique ID, optimizes via FFmpeg,
    generates thumbnails (for video), and uploads to Supabase Storage.
    """
    
    # 1. Generate Unique Identifiers
    unique_id = str(uuid.uuid4())[:8] # Random 8-char string
    original_base = file.filename.split('.')[0]
    base_name = f"{original_base}_{unique_id}"
    
    temp_input = f"temp_{unique_id}_{file.filename}"
    
    # 2. Save Input File Locally
    with open(temp_input, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 3. Configure Conversion Settings
    if "audio" in file.content_type:
        output_ext = "m4a"
        content_type = "audio/mp4" # Standard MIME for AAC
        conversion_args = {
            'format': 'ipod',       # Container for M4A
            'acodec': 'aac',        # High compatibility codec
            'audio_bitrate': '192k' 
        }
        thumb_output = None
    else:
        output_ext = "mp4"
        content_type = "video/mp4"
        conversion_args = {
            'format': 'mp4',
            'vcodec': 'libx264',    # Universal video codec
            'acodec': 'aac',        # Audio inside video
            'crf': 28,              # Balance quality/size (higher = smaller)
            'preset': 'veryfast',   # Fast encoding speed
            'movflags': '+faststart', # Optimizes for web streaming
            'pix_fmt': 'yuv420p'    # Ensures colors work on Apple devices
        }
        # Define thumbnail filename
        thumb_output = f"thumb_{base_name}.jpg"

    media_output = f"optimized_{base_name}.{output_ext}"
    
    try:
        thumb_url = None
        
        # 4. Generate & Upload Thumbnail (Video Only)
        if thumb_output:
            print("Generating thumbnail...")
            try:
                (
                    ffmpeg
                    .input(temp_input, ss=1)       # Capture frame at 1s mark
                    .filter('scale', 640, -1)      # Resize width to 640px
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
                print(f"Thumbnail generation failed (skipping): {e}")

        # 5. Convert Main Media
        print(f"Converting media to {output_ext}...")
        stream = ffmpeg.input(temp_input)
        stream = ffmpeg.output(stream, media_output, **conversion_args)
        ffmpeg.run(stream, overwrite_output=True)

        # 6. Upload Main Media
        print(f"Uploading optimized media...")
        with open(media_output, "rb") as f:
            storage_path = f"{output_ext}/{os.path.basename(media_output)}"
            supabase.storage.from_("media").upload(
                path=storage_path,
                file=f.read(),
                file_options={"content-type": content_type}
            )

        # 7. Retrieve Public URL
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
        # 8. Cleanup Temp Files
        print("Cleaning up temporary files...")
        paths_to_clean = [temp_input, media_output]
        if 'thumb_output' in locals() and thumb_output:
            paths_to_clean.append(thumb_output)
            
        for p in paths_to_clean:
            if p and os.path.exists(p):
                os.remove(p)

@app.delete("/media/{media_id}")
async def delete_media(media_id: str):
    """
    Deletes the media row from the database AND removes associated files
    (video/audio + thumbnail) from Supabase Storage.
    """
    try:
        # 1. Fetch metadata before deleting row
        response = supabase.table("media_items").select("*").eq("id", media_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")
            
        item = response.data[0]
        files_to_remove = []
        
        # 2. Identify Storage Paths
        main_path = get_storage_path(item.get("file_path"))
        if main_path:
            files_to_remove.append(main_path)
            
        thumb_path = get_storage_path(item.get("thumbnail_url"))
        if thumb_path:
            files_to_remove.append(thumb_path)
            
        # 3. Remove Files from Storage
        if files_to_remove:
            print(f"Removing files: {files_to_remove}")
            supabase.storage.from_("media").remove(files_to_remove)
            
        # 4. Delete Database Row
        supabase.table("media_items").delete().eq("id", media_id).execute()
        
        return {"status": "success", "deleted_id": media_id}

    except Exception as e:
        print(f"Delete Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))