# Photobooth Backend

Backend service for the next-generation AI-driven photobooth system.

## Architecture

The backend follows a clean architecture pattern with separation of concerns:

- **API Layer**: REST endpoints for frontend communication
- **Services**: Business logic (storage)
- **Config**: Configuration management

## Current Features

- Photo upload and local storage
- Media serving for display
- GDPR-compliant data retention

## Tech Stack

- Python 3.11+
- FastAPI (web framework)
- python-multipart (file uploads)

## Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Project Structure

```
backend/
├── app/
│   ├── api/v1/       # API routes (photos)
│   ├── services/     # Business logic (storage)
│   ├── config.py     # Configuration
│   └── main.py       # Application entry point
├── tests/            # Test suite
├── requirements.txt  # Python dependencies
└── README.md         # This file
```
