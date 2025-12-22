import os
import shutil
import uuid
import boto3
import ffmpeg
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
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
R2_PUBLIC_DOMAIN = os.getenv("R2_PUBLIC_DOMAIN")

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

def save_upload_file_tmp(upload_file: UploadFile) -> Path:
    """Save the uploaded file to a temporary location on disk."""
    try:
        file_extension = upload_file.filename.split(".")[-1]
        temp_filename = f"{uuid.uuid4()}.{file_extension}"
        temp_path = TEMP_DIR / temp_filename
        
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
            
        return temp_path
    finally:
        upload_file.file.close()

def generate_thumbnail(video_path: Path) -> Optional[Path]:
    """Use FFmpeg to generate a JPG thumbnail from a video."""
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

# --- NEW FUNCTION: CONVERT VIDEO ---
def convert_video_to_mp4(input_path: Path) -> Optional[Path]:
    """Converts input video to browser-compatible MP4 (H.264/AAC)."""
    output_path = input_path.with_suffix(".mp4")
    try:
        # If the input is already MP4, we still process it to ensure 
        # it has the right web-friendly codecs (h264/aac)
        (
            ffmpeg
            .input(str(input_path))
            .output(
                str(output_path), 
                vcodec='libx264', 
                acodec='aac', 
                strict='experimental',
                preset='fast', # Speed up conversion at slight cost of file size
                movflags='+faststart' # Critical for streaming in browser
            )
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        return output_path
    except ffmpeg.Error as e:
        print(f"Video Conversion Error: {e.stderr.decode('utf8')}")
        return None
    except Exception as e:
        print(f"General Conversion Error: {str(e)}")
        return None

def upload_file_to_r2(file_path: Path, content_type: str) -> str:
    """Uploads a local file to R2 and returns the public URL."""
    file_name = file_path.name
    try:
        s3_client.upload_file(
            str(file_path),
            R2_BUCKET_NAME,
            file_name,
            ExtraArgs={
                'ContentType': content_type,
                'ACL': 'public-read'
            }
        )
        return f"{R2_PUBLIC_DOMAIN}/{file_name}"
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
    user=Depends(get_current_user)
):
    temp_file_path = None
    converted_path = None
    thumb_path = None
    
    try:
        # 1. Save raw file to disk
        temp_file_path = save_upload_file_tmp(file)
        final_upload_path = temp_file_path
        final_content_type = file.content_type
        
        # 2. If it's a video, process it
        is_video = file.content_type.startswith("video")
        thumbnail_url = None

        if is_video:
            # Generate Thumbnail
            thumb_path = generate_thumbnail(temp_file_path)
            if thumb_path and thumb_path.exists():
                thumbnail_url = upload_file_to_r2(thumb_path, "image/jpeg")
            
            # Convert Video
            converted_path = convert_video_to_mp4(temp_file_path)
            if converted_path and converted_path.exists():
                # Swap the pointer: Upload the converted file instead of the raw one
                final_upload_path = converted_path
                final_content_type = "video/mp4"

        # 3. Upload Main Media File (Either raw audio/image OR converted video)
        public_url = upload_file_to_r2(final_upload_path, final_content_type)

        return {
            "public_url": public_url,
            "thumbnail_url": thumbnail_url,
            "message": "Upload and processing successful"
        }

    except Exception as e:
        print(f"Processing Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # 4. CLEANUP
        # We wrap these in try/except to ensure one failure doesn't stop cleanup
        for path in [temp_file_path, converted_path, thumb_path]:
            try:
                if path and path.exists():
                    os.remove(path)
            except:
                pass

@app.delete("/media/{media_id}")
async def delete_media(media_id: str, user=Depends(get_current_user)):
    try:
        response = supabase.table("media_items").delete().eq("id", media_id).execute()
        return {"message": "Media deleted successfully"}
    except Exception as e:
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