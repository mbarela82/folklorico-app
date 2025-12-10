import uvicorn

if __name__ == "__main__":
    # This points to the application we created in app/main.py
    # reload=True means the server restarts automatically when you save code changes
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)