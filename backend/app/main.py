"""
Main application entry point for the photobooth backend.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.api.v1 import photos, sessions, settings_api
from app.api import gallery, media_route

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
app.include_router(sessions.router, prefix=settings.API_V1_PREFIX)
app.include_router(settings_api.router, prefix=settings.API_V1_PREFIX)
app.include_router(gallery.router)
app.include_router(media_route.router)


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
