"""
Session service - manages photobooth sessions and events.
"""
import logging
import sqlite3
import secrets
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import Optional, List
from contextlib import contextmanager

from app.config import settings
from app.services.settings_store import get_settings

logger = logging.getLogger(__name__)

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
                photo_urls TEXT NOT NULL,
                deleted_at TEXT
            )
        """)
        try:
            conn.execute("ALTER TABLE sessions ADD COLUMN deleted_at TEXT")
        except sqlite3.OperationalError:
            pass
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
    """List non-deleted sessions for an event. Auto-cleans orphaned sessions."""
    cfg = get_settings()
    media_root = Path(cfg["media_root"]).resolve()

    with _get_connection() as conn:
        rows = conn.execute(
            """
            SELECT * FROM sessions
            WHERE event_slug = ? AND deleted_at IS NULL
            ORDER BY created_at DESC
            """,
            (event_slug,),
        ).fetchall()

        sessions = []
        for row in rows:
            photo_urls = json.loads(row["photo_urls"])
            has_files = any(
                (media_root / url.lstrip("/").removeprefix("media/")).is_file()
                for url in photo_urls
            ) if photo_urls else False

            if photo_urls and not has_files:
                conn.execute(
                    "UPDATE sessions SET deleted_at = ? WHERE id = ?",
                    (datetime.utcnow().isoformat(), row["id"]),
                )
                continue

            sessions.append(_row_to_session(row))

        conn.commit()
        return sessions


def delete_session(session_id: str) -> bool:
    """Soft-delete a session and hard-delete its photo files from disk."""
    cfg = get_settings()
    media_root = Path(cfg["media_root"]).resolve()

    with _get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM sessions WHERE id = ? AND deleted_at IS NULL",
            (session_id,),
        ).fetchone()
        if not row:
            return False

        photo_urls = json.loads(row["photo_urls"])
        for url in photo_urls:
            rel = url.lstrip("/").removeprefix("media/")
            file_path = media_root / rel
            if file_path.is_file():
                file_path.unlink()
                logger.info(f"Deleted photo file: {file_path}")

        # Remove empty parent directories up to the event folder
        for url in photo_urls:
            rel = url.lstrip("/").removeprefix("media/")
            file_path = media_root / rel
            parent = file_path.parent
            try:
                if parent.is_dir() and not any(parent.iterdir()):
                    parent.rmdir()
                    logger.info(f"Removed empty directory: {parent}")
            except OSError:
                pass

        conn.execute(
            "UPDATE sessions SET deleted_at = ? WHERE id = ?",
            (datetime.utcnow().isoformat(), session_id),
        )
        conn.commit()
    return True


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
    """Get session by ID. If token provided, validates it. Returns None if expired, invalid, or deleted."""
    with _get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM sessions WHERE id = ? AND deleted_at IS NULL",
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
