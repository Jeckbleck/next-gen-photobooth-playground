"""
Event service - manages photobooth events.
"""
import sqlite3
import re
from pathlib import Path
from typing import List, Optional
from contextlib import contextmanager

DB_PATH = Path(__file__).parent.parent.parent / "photobooth.db"


def _slugify(name: str) -> str:
    """Convert name to URL-safe slug."""
    s = re.sub(r"[^\w\s-]", "", name.lower())
    s = re.sub(r"[-\s]+", "-", s).strip("-")
    return s or "event"


def _row_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "slug": row["slug"],
        "created_at": row["created_at"],
        "paywall_enabled": bool(row["paywall_enabled"]),
    }


@contextmanager
def _get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL,
                paywall_enabled INTEGER DEFAULT 0
            )
        """)
        try:
            conn.execute("ALTER TABLE events ADD COLUMN paywall_enabled INTEGER DEFAULT 0")
        except sqlite3.OperationalError:
            pass
        conn.execute(
            "INSERT OR IGNORE INTO events (name, slug, created_at) VALUES (?, ?, datetime('now'))",
            ("On Location", "onlocation"),
        )
        conn.commit()
        yield conn
    finally:
        conn.close()


def list_events() -> List[dict]:
    """List all events."""
    with _get_connection() as conn:
        rows = conn.execute(
            "SELECT id, name, slug, created_at, paywall_enabled FROM events ORDER BY name"
        ).fetchall()
        return [_row_to_dict(r) for r in rows]


def create_event(name: str) -> dict:
    """Create a new event. Slug is derived from name."""
    slug = _slugify(name)
    if not slug:
        slug = "event"
    with _get_connection() as conn:
        base_slug = slug
        n = 0
        while conn.execute("SELECT 1 FROM events WHERE slug = ?", (slug,)).fetchone():
            n += 1
            slug = f"{base_slug}-{n}"
        conn.execute(
            "INSERT INTO events (name, slug, created_at) VALUES (?, ?, datetime('now'))",
            (name, slug),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, name, slug, created_at, paywall_enabled FROM events WHERE slug = ?", (slug,)
        ).fetchone()
        return _row_to_dict(row)


def get_event_by_slug(slug: str) -> Optional[dict]:
    """Get event by slug."""
    with _get_connection() as conn:
        row = conn.execute(
            "SELECT id, name, slug, created_at, paywall_enabled FROM events WHERE slug = ?", (slug,)
        ).fetchone()
        if row:
            return _row_to_dict(row)
        return None


def update_event_paywall(slug: str, enabled: bool) -> Optional[dict]:
    """Toggle paywall for an event."""
    with _get_connection() as conn:
        row = conn.execute("SELECT 1 FROM events WHERE slug = ?", (slug,)).fetchone()
        if not row:
            return None
        conn.execute(
            "UPDATE events SET paywall_enabled = ? WHERE slug = ?",
            (1 if enabled else 0, slug),
        )
        conn.commit()
        row = conn.execute(
            "SELECT id, name, slug, created_at, paywall_enabled FROM events WHERE slug = ?", (slug,)
        ).fetchone()
        return _row_to_dict(row)
