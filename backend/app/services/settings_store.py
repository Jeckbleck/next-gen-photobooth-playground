"""
Settings store - persists photobooth settings to JSON.
"""
import hashlib
import json
from pathlib import Path
from typing import Optional

from app.config import settings as default_settings

SETTINGS_FILE = Path(__file__).parent.parent.parent / "settings.json"
DEFAULT_PASSWORD = "1234"
PASSWORD_PEPPER = "photobooth-salt"


def _hash_password(password: str) -> str:
    return hashlib.sha256((password + PASSWORD_PEPPER).encode()).hexdigest()


def _load_raw() -> dict:
    if SETTINGS_FILE.exists():
        try:
            return json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass
    return {}


def get_settings() -> dict:
    """Get current settings (merged with defaults). Does not include password hash."""
    raw = _load_raw()
    return {
        "media_root": raw.get("media_root", default_settings.MEDIA_ROOT),
        "default_event_slug": raw.get("default_event_slug", default_settings.DEFAULT_EVENT),
    }


def verify_password(password: str) -> bool:
    """Verify the admin password."""
    raw = _load_raw()
    stored_hash = raw.get("admin_password_hash")
    if stored_hash is None:
        return password == DEFAULT_PASSWORD
    return _hash_password(password) == stored_hash


def change_password(current_password: str, new_password: str) -> bool:
    """Change admin password. Returns True on success."""
    if not verify_password(current_password):
        return False
    new_password = (new_password or "").strip()
    if not new_password:
        return False
    raw = _load_raw()
    raw["admin_password_hash"] = _hash_password(new_password)
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    SETTINGS_FILE.write_text(json.dumps(raw, indent=2), encoding="utf-8")
    return True


def save_settings(
    media_root: Optional[str] = None,
    default_event_slug: Optional[str] = None,
) -> dict:
    """Update and persist settings. Does not touch password."""
    raw = _load_raw()
    current = {
        "media_root": raw.get("media_root", default_settings.MEDIA_ROOT),
        "default_event_slug": raw.get("default_event_slug", default_settings.DEFAULT_EVENT),
    }
    if media_root is not None:
        current["media_root"] = str(media_root).strip() or default_settings.MEDIA_ROOT
    if default_event_slug is not None:
        current["default_event_slug"] = str(default_event_slug).strip() or default_settings.DEFAULT_EVENT
    # Preserve admin_password_hash when updating other settings
    if "admin_password_hash" in raw:
        current["admin_password_hash"] = raw["admin_password_hash"]
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    SETTINGS_FILE.write_text(json.dumps(current, indent=2), encoding="utf-8")
    return get_settings()
