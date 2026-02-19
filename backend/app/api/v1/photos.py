"""
Photo upload and storage API.
Accepts photos from the frontend (browser capture) and stores them locally.
Organizes by event: media_root/events/{event_slug}/uploads/
"""
from pathlib import Path

from fastapi import APIRouter, File, UploadFile, HTTPException, Form

from app.config import settings
from app.services.storage_service import StorageService
from app.services import session_service
from app.services.settings_store import get_settings

router = APIRouter(prefix="/photos", tags=["photos"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _get_storage() -> StorageService:
    cfg = get_settings()
    return StorageService(
        media_root=cfg["media_root"],
        retention_days=settings.DATA_RETENTION_DAYS,
    )


def _saved_path_to_url(saved_path: str, media_root: str) -> str:
    """Convert filesystem path to URL path under /media."""
    path = Path(saved_path)
    try:
        rel = path.relative_to(Path(media_root).resolve())
    except ValueError:
        rel = path.name
        if "events" in saved_path:
            parts = saved_path.replace("\\", "/").split("/")
            if "events" in parts:
                idx = parts.index("events")
                rel = Path("/".join(parts[idx:]))
        else:
            rel = Path("uploads") / path.name
    return f"/media/{rel.as_posix()}"


@router.post("/upload")
async def upload_photo(
    file: UploadFile = File(...),
    session_id: str = Form(None),
):
    """
    Upload a photo (from browser capture). Saves to local storage.
    If session_id provided, associates the photo with that session and uses its event.
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

    cfg = get_settings()
    event_slug = cfg["default_event_slug"]
    if session_id:
        sess = session_service.get_session(session_id, token=None)
        if sess:
            event_slug = sess["event_slug"]

    storage = _get_storage()
    saved_path = await storage.save_upload(data, filename, event_slug=event_slug)
    url = _saved_path_to_url(saved_path, cfg["media_root"])

    if session_id:
        session_service.add_photo_to_session(session_id, url)

    return {"url": url, "path": saved_path}
