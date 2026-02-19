"""
Dynamic media serving - serves files from configured media_root.
"""
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.services.settings_store import get_settings

router = APIRouter(tags=["media"])


@router.get("/media/{path:path}")
async def serve_media(path: str):
    """Serve a file from the configured media root."""
    media_root = Path(get_settings()["media_root"]).resolve()
    file_path = (media_root / path).resolve()
    if not str(file_path).startswith(str(media_root)):
        raise HTTPException(status_code=403, detail="Invalid path")
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(file_path)
