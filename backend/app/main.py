from fastapi import FastAPI
from supabase import create_client, Client
import os
from dotenv import load_dotenv

# 1. Load the secrets from the .env file
load_dotenv()

# 2. Setup Supabase connection
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# 3. Initialize the App
app = FastAPI()

# 4. Create a test route
@app.get("/")
def read_root():
    return {"message": "Hola! The Folklorico API is running."}

# 5. Create a route to test the database
@app.get("/test-db")
def test_db():
    # This tries to get all profiles. 
    # It might return an empty list if no one has signed up, but it proves the connection works.
    response = supabase.table("profiles").select("*").execute()
    return response