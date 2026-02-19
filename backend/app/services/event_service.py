"""
Event service - manages photobooth events.
"""
import sqlite3
import re
from pathlib import Path
from typing import List
from contextlib import contextmanager

DB_PATH = Path(__file__).parent.parent.parent / "photobooth.db"


def _slugify(name: str) -> str:
    """Convert name to URL-safe slug."""
    s = re.sub(r"[^\w\s-]", "", name.lower())
    s = re.sub(r"[-\s]+", "-", s).strip("-")
    return s or "event"


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
                created_at TEXT NOT NULL
            )
        """)
        # Ensure onlocation exists
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
            "SELECT id, name, slug, created_at FROM events ORDER BY name"
        ).fetchall()
        return [
            {"id": r["id"], "name": r["name"], "slug": r["slug"], "created_at": r["created_at"]}
            for r in rows
        ]


def create_event(name: str) -> dict:
    """Create a new event. Slug is derived from name."""
    slug = _slugify(name)
    if not slug:
        slug = "event"
    with _get_connection() as conn:
        # Ensure slug is unique
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
            "SELECT id, name, slug, created_at FROM events WHERE slug = ?", (slug,)
        ).fetchone()
        return {"id": row["id"], "name": row["name"], "slug": row["slug"], "created_at": row["created_at"]}


def get_event_by_slug(slug: str) -> dict | None:
    """Get event by slug."""
    with _get_connection() as conn:
        row = conn.execute(
            "SELECT id, name, slug, created_at FROM events WHERE slug = ?", (slug,)
        ).fetchone()
        if row:
            return {"id": row["id"], "name": row["name"], "slug": row["slug"], "created_at": row["created_at"]}
        return None
