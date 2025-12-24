import os
import uuid
import boto3
import ffmpeg
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.concurrency import run_in_threadpool
from supabase import create_client, Client
from dotenv import load_dotenv

# Import Boto3 Configs for stability
from boto3.s3.transfer import TransferConfig
from botocore.config import Config as BotoConfig

# 1. Load Environment Variables
load_dotenv()

# 2. Setup Supabase Client (Service Role)
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")

if not url or not key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")

supabase: Client = create_client(url, key)

# 3. Setup Cloudflare R2 (Boto3)
r2_config = BotoConfig(
    connect_timeout=120,
    read_timeout=600,
    retries={'max_attempts': 3}
)

s3_client = boto3.client(
    service_name='s3',
    endpoint_url=f"https://{os.environ.get('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
    aws_access_key_id=os.environ.get('R2_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('R2_SECRET_ACCESS_KEY'),
    region_name="auto",
    config=r2_config
)

R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME")
R2_PUBLIC_DOMAIN = os.environ.get("R2_PUBLIC_DOMAIN", "").rstrip("/")

# Optimize for speed
transfer_config = TransferConfig(
    multipart_threshold=1024 * 25,
    max_concurrency=10,
    multipart_chunksize=1024 * 25,
    use_threads=True
)

# 4. Initialize FastAPI
app = FastAPI()
security = HTTPBearer()

# 5. Setup CORS
origins = [
    "http://localhost:3000",
    "https://www.sarape.app",
    "https://sarape.app",
    "https://folklorico-app.vercel.app",
    "*"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)

# --- SECURITY DEPENDENCY ---
def verify_admin_or_teacher(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Verify Token
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
             raise HTTPException(status_code=401, detail="Invalid token")

        user_id = user_response.user.id

        # Verify Role
        response = supabase.table("profiles").select("role").eq("id", user_id).single().execute()
        user_role = response.data.get("role") if response.data else "dancer"

        if user_role not in ["admin", "teacher"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        return user_id

    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=401, detail=str(e))


# --- ASYNC HELPER: SAVE TEMP FILE ---
async def save_upload_file_tmp(upload_file: UploadFile, title: str) -> Path:
    try:
        clean_title = "".join([c for c in title.lower().replace(" ", "_") if c.isalnum() or c == "_"])
        file_ext = upload_file.filename.split(".")[-1]
        short_id = str(uuid.uuid4())[:8]
        new_filename = f"{clean_title}_{short_id}.{file_ext}"

        temp_path = TEMP_DIR / new_filename

        # Read in 5MB chunks
        with open(temp_path, "wb") as buffer:
            while True:
                chunk = await upload_file.read(1024 * 1024 * 5)
                if not chunk:
                    break
                buffer.write(chunk)

        print(f"Upload Finished.")
        return temp_path

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File Save Error: {str(e)}")
    finally:
        await upload_file.close()


# --- SYNC WORKERS ---

def generate_thumbnail_sync(video_path: Path) -> Optional[Path]:
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
        print(f"Thumbnail Warning: {e}")
        return None

def convert_media_sync(input_path: Path, is_video: bool) -> Optional[Path]:
    try:
        if is_video:
            # FIX: Never write output to the same path as the input (prevents truncation when input is already .mp4)
            output_path = input_path.with_name(f"{input_path.stem}_converted.mp4")
            (
                ffmpeg.input(str(input_path))
                .output(
                    str(output_path),
                    vcodec='libx264',
                    acodec='aac',
                    preset='fast',
                    movflags='+faststart',
                    crf=23
                )
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
        else:
            output_path = input_path.with_name(f"{input_path.stem}_converted.m4a")
            (
                ffmpeg.input(str(input_path))
                .output(str(output_path), acodec='aac', audio_bitrate='192k')
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
        return output_path
    except Exception as e:
        print(f"Conversion Warning (Using Original): {e}")
        return None

def upload_to_r2_sync(file_path: Path, content_type: str, folder: str) -> str:
    file_name = file_path.name
    object_key = f"{folder}/{file_name}"
    try:
        s3_client.upload_file(
            str(file_path),
            R2_BUCKET_NAME,
            object_key,
            ExtraArgs={'ContentType': content_type, 'ACL': 'public-read'},
            Config=transfer_config
        )
        domain = R2_PUBLIC_DOMAIN if R2_PUBLIC_DOMAIN.startswith("http") else f"https://{R2_PUBLIC_DOMAIN}"
        return f"{domain}/{object_key}"
    except Exception as e:
        raise Exception(f"R2 Upload Failed: {str(e)}")


# --- ROUTES ---

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Backend Active"}

@app.post("/upload/convert")
async def upload_file(
    title: str = Form(...),
    file: UploadFile = File(...),
    region_id: Optional[str] = Form(None),
    region: Optional[str] = Form(None),
    current_user_id: str = Depends(verify_admin_or_teacher)
):
    temp_path = None
    converted_path = None
    thumb_path = None

    print(f"--- UPLOAD REQUEST START ---")
    print(f"User ID: {current_user_id}")

    try:
        # 1. Save to Disk
        temp_path = await save_upload_file_tmp(file, title)

        is_video = file.content_type.startswith("video")
        final_path = temp_path
        final_content_type = file.content_type
        folder_name = "misc"
        thumbnail_url = None

        # 2. Process Media
        if is_video:
            folder_name = "mp4"
            thumb_path = await run_in_threadpool(generate_thumbnail_sync, temp_path)
            if thumb_path and thumb_path.exists():
                thumbnail_url = await run_in_threadpool(
                    upload_to_r2_sync, thumb_path, "image/jpeg", "thumbnails"
                )

            print("Starting video conversion...")
            converted_path = await run_in_threadpool(convert_media_sync, temp_path, True)
            if converted_path and converted_path.exists():
                final_path = converted_path
                final_content_type = "video/mp4"

        elif file.content_type.startswith("audio"):
            folder_name = "m4a"
            print("Starting audio conversion...")
            converted_path = await run_in_threadpool(convert_media_sync, temp_path, False)
            if converted_path and converted_path.exists():
                final_path = converted_path
                final_content_type = "audio/mp4"

        # 3. Upload to R2
        print(f"Uploading {final_path} to R2...")
        public_url = await run_in_threadpool(
            upload_to_r2_sync, final_path, final_content_type, folder_name
        )

        # 4. Save to Database (NOW SAVING BOTH IDs)
        row_data = {
            "title": title,
            "file_path": public_url,
            "media_type": "video" if is_video else "audio",
            "thumbnail_url": thumbnail_url,
            "uploader_id": current_user_id, # Old Column
            "user_id": current_user_id      # New Column (Fixes Null)
        }

        if region_id and region_id not in ["null", "undefined"]:
             try:
                 row_data["region_id"] = int(region_id)
                 if region: row_data["region"] = region
             except:
                 pass
        elif region:
             row_data["region"] = region

        print(f"Inserting into DB: {row_data}")

        db_response = supabase.table("media_items").insert(row_data).execute()

        return {
            "status": "success",
            "data": db_response.data[0] if db_response.data else {},
            "public_url": public_url
        }

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        for p in [temp_path, converted_path, thumb_path]:
            if p and p.exists():
                try:
                    os.remove(p)
                except:
                    pass

@app.delete("/media/{media_id}")
async def delete_media(
    media_id: str,
    user_id: str = Depends(verify_admin_or_teacher)
):
    try:
        response = supabase.table("media_items").select("*").eq("id", media_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Item not found")

        item = response.data[0]

        def delete_r2_sync(url_str):
            if url_str and R2_PUBLIC_DOMAIN in url_str:
                clean_domain = R2_PUBLIC_DOMAIN.rstrip("/")
                key = url_str.replace(f"{clean_domain}/", "")
                try:
                    s3_client.delete_object(Bucket=R2_BUCKET_NAME, Key=key)
                except Exception as e:
                    print(f"R2 Delete Warning: {e}")

        await run_in_threadpool(delete_r2_sync, item.get("file_path"))
        await run_in_threadpool(delete_r2_sync, item.get("thumbnail_url"))

        supabase.table("media_items").delete().eq("id", media_id).execute()

        return {"status": "success", "message": "Media deleted"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Increased timeout settings for local testing
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True, timeout_keep_alive=120)
