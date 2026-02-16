"""
Photo upload and storage API.
Accepts photos from the frontend (browser capture) and stores them locally.
"""
from pathlib import Path

from fastapi import APIRouter, File, UploadFile, HTTPException

from app.config import settings
from app.services.storage_service import StorageService

router = APIRouter(prefix="/photos", tags=["photos"])
storage = StorageService(
    media_root=settings.MEDIA_ROOT,
    retention_days=settings.DATA_RETENTION_DAYS,
)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _saved_path_to_url(saved_path: str) -> str:
    """Convert filesystem path to URL path under /media."""
    path = Path(saved_path)
    try:
        rel = path.relative_to(Path(settings.MEDIA_ROOT).resolve())
    except ValueError:
        rel = path.name
        if "uploads" in saved_path:
            rel = Path("uploads") / path.name
    return f"/media/{rel.as_posix()}"


@router.post("/upload")
async def upload_photo(file: UploadFile = File(...)):
    """
    Upload a photo (from browser capture). Saves to local storage and returns the URL to display it.
    """
    content_type = (file.content_type or "").split(";")[0].strip()
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_CONTENT_TYPES)}",
        )
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    filename = file.filename or "photo.jpg"
    if not filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        filename = filename + ".jpg"
    saved_path = await storage.save_upload(data, filename)
    url = _saved_path_to_url(saved_path)
    return {"url": url, "path": saved_path}
