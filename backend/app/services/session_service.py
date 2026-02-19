"""
Session service - manages photobooth sessions and events.
"""
import sqlite3
import secrets
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, List
from contextlib import contextmanager

from app.config import settings
from app.services.settings_store import get_settings

DB_PATH = Path(__file__).parent.parent.parent / "photobooth.db"


def _get_db_path() -> Path:
    return DB_PATH


@contextmanager
def _get_connection():
    db_path = _get_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                event_slug TEXT NOT NULL,
                token TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                photo_urls TEXT NOT NULL
            )
        """)
        conn.commit()
        yield conn
    finally:
        conn.close()


def create_session(event_slug: str = None) -> dict:
    """Create a new session for the given event."""
    event_slug = event_slug or get_settings().get("default_event_slug", settings.DEFAULT_EVENT)
    session_id = secrets.token_urlsafe(16)
    token = secrets.token_urlsafe(32)
    now = datetime.utcnow()
    expires_at = now + timedelta(hours=settings.GALLERY_EXPIRY_HOURS)

    with _get_connection() as conn:
        conn.execute(
            """
            INSERT INTO sessions (id, event_slug, token, created_at, expires_at, photo_urls)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (session_id, event_slug, token, now.isoformat(), expires_at.isoformat(), json.dumps([])),
        )
        conn.commit()

    return {
        "id": session_id,
        "event_slug": event_slug,
        "token": token,
        "created_at": now,
        "expires_at": expires_at,
        "photo_urls": [],
        "gallery_url": _build_gallery_url(session_id, token),
    }


def add_photo_to_session(session_id: str, photo_url: str) -> Optional[dict]:
    """Add a photo URL to a session. Returns updated session or None if not found."""
    with _get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM sessions WHERE id = ?",
            (session_id,),
        ).fetchone()
        if not row:
            return None

        urls = json.loads(row["photo_urls"])
        urls.append(photo_url)
        conn.execute(
            "UPDATE sessions SET photo_urls = ? WHERE id = ?",
            (json.dumps(urls), session_id),
        )
        conn.commit()

        row = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
        return _row_to_session(row)


def list_sessions_for_event(event_slug: str) -> List[dict]:
    """List all sessions for an event (including expired). For admin/preview use."""
    with _get_connection() as conn:
        rows = conn.execute(
            """
            SELECT * FROM sessions
            WHERE event_slug = ?
            ORDER BY created_at DESC
            """,
            (event_slug,),
        ).fetchall()
        return [_row_to_session(row) for row in rows]


def regenerate_session_token(session_id: str) -> Optional[dict]:
    """Generate new token and extend expiry. Returns updated session or None."""
    new_token = secrets.token_urlsafe(32)
    now = datetime.utcnow()
    expires_at = now + timedelta(hours=settings.GALLERY_EXPIRY_HOURS)

    with _get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM sessions WHERE id = ?",
            (session_id,),
        ).fetchone()
        if not row:
            return None

        conn.execute(
            "UPDATE sessions SET token = ?, expires_at = ? WHERE id = ?",
            (new_token, expires_at.isoformat(), session_id),
        )
        conn.commit()

        row = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
        return _row_to_session(row)


def get_session(session_id: str, token: str = None) -> Optional[dict]:
    """Get session by ID. If token provided, validates it. Returns None if expired or invalid."""
    with _get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM sessions WHERE id = ?",
            (session_id,),
        ).fetchone()
        if not row:
            return None

        if token and row["token"] != token:
            return None

        expires_at = datetime.fromisoformat(row["expires_at"])
        if datetime.utcnow() > expires_at:
            return None

        return _row_to_session(row)


def _row_to_session(row) -> dict:
    return {
        "id": row["id"],
        "event_slug": row["event_slug"],
        "token": row["token"],
        "created_at": datetime.fromisoformat(row["created_at"]),
        "expires_at": datetime.fromisoformat(row["expires_at"]),
        "photo_urls": json.loads(row["photo_urls"]),
        "gallery_url": _build_gallery_url(row["id"], row["token"]),
    }


def _build_gallery_url(session_id: str, token: str) -> str:
    base = settings.GALLERY_BASE_URL.rstrip("/")
    return f"{base}/gallery/{session_id}?token={token}"
