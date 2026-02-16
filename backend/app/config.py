"""
Configuration management for the photobooth backend.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings."""
    
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = False
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # Vite default dev server
        "http://localhost:3000",  # Alternative React dev server
    ]
    
    # Media Storage
    MEDIA_ROOT: str = "./media"
    
    # Events & Sessions
    DEFAULT_EVENT: str = "onlocation"
    GALLERY_EXPIRY_HOURS: int = 1
    GALLERY_BASE_URL: str = "http://localhost:8000"  # Base URL for gallery links (QR codes)
    
    # GDPR & Privacy
    DATA_RETENTION_DAYS: int = 30
    AUTO_DELETE_ENABLED: bool = True
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
