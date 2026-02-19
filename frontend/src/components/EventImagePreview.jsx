/**
 * EventImagePreview - Modular preview of photos for an event.
 * Groups by session (photo sets) and allows clicking to view in detail.
 */
import { useState, useEffect } from 'react'
import { listEventSessions } from '../api/settingsApi'
import { SessionDetailModal } from './SessionDetailModal'

function formatSessionDate(createdAt) {
  if (!createdAt) return ''
  try {
    const d = new Date(createdAt)
    return d.toLocaleString(undefined, {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return ''
  }
}

export function EventImagePreview({ eventSlug, className = '' }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedSession, setSelectedSession] = useState(null)

  useEffect(() => {
    if (!eventSlug) {
      setSessions([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    listEventSessions(eventSlug)
      .then((data) => {
        if (!cancelled) setSessions(data.sessions || [])
      })
      .catch((e) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [eventSlug])

  if (!eventSlug) {
    return (
      <div className={`event-image-preview ${className}`}>
        <p className="preview-placeholder">Select an event to preview photos</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`event-image-preview ${className}`}>
        <p className="preview-placeholder">Loading photos…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`event-image-preview ${className}`}>
        <p className="preview-error">{error}</p>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className={`event-image-preview ${className}`}>
        <p className="preview-placeholder">No photos for this event yet</p>
      </div>
    )
  }

  return (
    <div className={`event-image-preview ${className}`}>
      <div className="session-sets-grid">
        {sessions.map((session) => {
          const urls = session.photo_urls || []
          if (urls.length === 0) return null
          return (
            <button
              key={session.id}
              type="button"
              className="session-set-card"
              onClick={() => setSelectedSession(session)}
            >
              <div className="session-set-thumbs">
                {urls.slice(0, 3).map((url, i) => (
                  <div key={i} className="session-set-thumb">
                    <img src={url} alt={`Photo ${i + 1}`} loading="lazy" />
                  </div>
                ))}
              </div>
              <p className="session-set-date">{formatSessionDate(session.created_at)}</p>
            </button>
          )
        })}
      </div>

      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  )
}
