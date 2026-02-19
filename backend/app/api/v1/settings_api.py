"""
Settings and events API - for the customization menu.
"""
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Body

from app.services.settings_store import get_settings, save_settings, verify_password, change_password
from app.services import event_service, session_service

router = APIRouter(prefix="/settings", tags=["settings"])


def _browse_folder() -> Optional[str]:
    """Open native folder picker via subprocess (avoids tkinter threading issues)."""
    import subprocess
    import sys
    try:
        code = """
import tkinter as tk
from tkinter import filedialog
root = tk.Tk()
root.withdraw()
root.attributes("-topmost", True)
path = filedialog.askdirectory(title="Select storage folder for photos")
print(path or "")
root.destroy()
"""
        result = subprocess.run(
            [sys.executable, "-c", code],
            capture_output=True,
            text=True,
            timeout=120,
        )
        path = (result.stdout or "").strip()
        return path if path else None
    except Exception:
        return None


@router.get("")
def get_app_settings():
    """Get current photobooth settings."""
    return get_settings()


@router.put("")
def update_settings(
    media_root: Optional[str] = Body(None),
    default_event_slug: Optional[str] = Body(None),
):
    """Update settings. Pass only the fields to change."""
    return save_settings(media_root=media_root, default_event_slug=default_event_slug)


@router.post("/verify-password")
def api_verify_password(body: dict = Body(...)):
    """Verify the admin password."""
    password = (body.get("password") or "").strip()
    return {"valid": verify_password(password)}


@router.post("/change-password")
def api_change_password(body: dict = Body(...)):
    """Change the admin password. Requires current password."""
    current = (body.get("current_password") or "").strip()
    new_pw = (body.get("new_password") or "").strip()
    if not new_pw:
        raise HTTPException(status_code=400, detail="New password is required")
    if not change_password(current, new_pw):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    return {"success": True}


@router.get("/browse-folder")
def browse_folder():
    """Open native folder picker and return selected path."""
    path = _browse_folder()
    if path is None:
        raise HTTPException(status_code=503, detail="Folder picker not available")
    return {"path": path}


@router.get("/events")
def list_events():
    """List all events."""
    return event_service.list_events()


@router.get("/events/{slug}/sessions")
def list_event_sessions(slug: str):
    """List sessions for an event (grouped photo sets)."""
    sessions = session_service.list_sessions_for_event(slug)
    return {"sessions": sessions}


@router.post("/sessions/{session_id}/regenerate")
def regenerate_session(session_id: str):
    """Regenerate gallery token and extend expiry."""
    session = session_service.regenerate_session_token(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.get("/events/{slug}/photos")
def list_event_photos(slug: str):
    """List photo URLs for an event."""
    cfg = get_settings()
    media_root = Path(cfg["media_root"])
    upload_dir = media_root / "events" / slug / "uploads"
    if not upload_dir.exists():
        return {"photos": []}
    extensions = {".jpg", ".jpeg", ".png", ".webp"}
    media_resolved = media_root.resolve()
    photos = []
    for f in sorted(upload_dir.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True):
        if f.is_file() and f.suffix.lower() in extensions:
            try:
                rel = f.resolve().relative_to(media_resolved)
            except ValueError:
                rel = Path("events") / slug / "uploads" / f.name
            photos.append(f"/media/{rel.as_posix()}")
    return {"photos": photos}


@router.post("/events")
def create_event(body: dict = Body(...)):
    """Create a new event."""
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Event name is required")
    return event_service.create_event(name)
