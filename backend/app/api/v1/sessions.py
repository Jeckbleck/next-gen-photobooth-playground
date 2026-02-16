"""
Session API - create and retrieve photobooth sessions.
"""
from typing import Optional

from fastapi import APIRouter, HTTPException, Body

from app.services import session_service
from app.models.session import SessionCreate, SessionResponse

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse)
async def create_session(body: Optional[SessionCreate] = Body(default=None)):
    body = body or SessionCreate()
    """
    Create a new session for a photobooth capture.
    Default event is 'onlocation'.
    """
    body = body or SessionCreate()
    session = session_service.create_session(body.event_slug)
    return SessionResponse(
        id=session["id"],
        event_slug=session["event_slug"],
        created_at=session["created_at"],
        expires_at=session["expires_at"],
        photo_urls=session["photo_urls"],
        gallery_url=session["gallery_url"],
        token=session["token"],
    )


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, token: str = None):
    """
    Get session by ID. Token is required for validation.
    Returns 404 if expired or invalid.
    """
    session = session_service.get_session(session_id, token)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")
    return SessionResponse(
        id=session["id"],
        event_slug=session["event_slug"],
        created_at=session["created_at"],
        expires_at=session["expires_at"],
        photo_urls=session["photo_urls"],
        gallery_url=session["gallery_url"],
        token=session["token"],
    )
