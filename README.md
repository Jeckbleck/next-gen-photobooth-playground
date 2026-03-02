# Next-Gen Photobooth Playground

A lightweight, event-based photobooth for venues and 24/7 use. No monthly subscriptions—runs on a touchscreen, camera, and mini PC.

## Overview

- **Capture**: Browser-based camera capture with countdown (3 photos per session)
- **Storage**: Photos organized by event, configurable storage path
- **Sharing**: QR code links to a time-limited gallery (1 hour)
- **Settings**: Password-protected menu for storage, events, and admin password

## Tech Stack

| Layer   | Stack                    |
|---------|--------------------------|
| Frontend| React 19, Vite, Tailwind |
| Backend | FastAPI, Uvicorn         |
| Storage | SQLite, local filesystem |

## Quick Start

```bash
# Backend
cd backend && pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Open `http://localhost:5173`. Default settings password: `1234`.

## Project Structure

```
├── frontend/     # React app (greeting, capture, review, settings)
├── backend/      # FastAPI API (sessions, photos, gallery, settings)
└── .env.example  # See backend/.env.example for config
```

See `backend/README.md` and `frontend/` for detailed setup.
