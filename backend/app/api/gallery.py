"""
Gallery - serves shareable gallery page for a session.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse

from app.services import session_service
from app.config import settings

router = APIRouter(tags=["gallery"])


@router.get("/gallery/{session_id}", response_class=HTMLResponse)
async def gallery_page(session_id: str, token: str):
    """
    Serve the gallery page for a session. Requires valid token.
    Returns 404 if expired or invalid.
    """
    session = session_service.get_session(session_id, token)
    if not session:
        raise HTTPException(status_code=404, detail="Gallery not found or expired")

    # Use relative URLs - images resolve from same origin as the gallery page
    photo_urls = session["photo_urls"]
    html = _gallery_html(photo_urls, session["expires_at"])
    return HTMLResponse(html)


def _gallery_html(photo_urls: list, expires_at) -> str:
    imgs = "".join(
        f'<img src="{url}" alt="Photo {i+1}" class="gallery-photo" />'
        for i, url in enumerate(photo_urls)
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Photobooth Photos</title>
  <style>
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; padding: 1rem; font-family: system-ui, sans-serif; background: #1a1a1a; color: #fff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; }}
    h1 {{ margin: 0 0 1rem; font-size: 1.5rem; }}
    .gallery {{ display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center; max-width: 900px; }}
    .gallery-photo {{ width: 100%; max-width: 280px; aspect-ratio: 3/4; object-fit: cover; border-radius: 12px; }}
    .expires {{ margin-top: 1rem; font-size: 0.9rem; color: #888; }}
  </style>
</head>
<body>
  <h1>Your Photobooth Photos</h1>
  <div class="gallery">{imgs}</div>
  <p class="expires">Available for 1 hour</p>
</body>
</html>"""
