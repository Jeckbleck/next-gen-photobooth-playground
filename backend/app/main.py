"""
Main application entry point for the photobooth backend.
"""
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.api.v1 import photos

app = FastAPI(
    title="Photobooth API",
    description="Backend API for AI-driven photobooth system",
    version="0.1.0",
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(photos.router, prefix=settings.API_V1_PREFIX)

# Serve uploaded media so frontend can display photos
media_path = Path(settings.MEDIA_ROOT).resolve()
media_path.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(media_path)), name="media")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Photobooth API is running", "version": "0.1.0"}


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "service": "photobooth-backend",
    }
