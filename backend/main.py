from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.routes.health import router as health_router
from backend.api.routes.emotion import router as emotion_router
from backend.api.routes.conversations import router as conversations_router
from backend.api.routes.auth import router as auth_router

app = FastAPI(
    title="EmoSense API",
    description="Backend API for the EmoSense emotion-aware application",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


@app.get("/")
def root():
    return {
        "message": "Welcome to EmoSense API",
        "status": "running"
    }


app.include_router(health_router)
app.include_router(emotion_router)
app.include_router(auth_router)
app.include_router(conversations_router)