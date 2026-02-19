/**
 * Settings and events API client.
 */

const API_BASE = ''

export async function getSettings() {
  const res = await fetch(`${API_BASE}/api/v1/settings`)
  if (!res.ok) throw new Error('Failed to fetch settings')
  return res.json()
}

export async function verifyPassword(password) {
  const res = await fetch(`${API_BASE}/api/v1/settings/verify-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) throw new Error('Failed to verify password')
  const data = await res.json()
  return data.valid
}

export async function changePassword(currentPassword, newPassword) {
  const res = await fetch(`${API_BASE}/api/v1/settings/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to change password')
  }
  return res.json()
}

export async function updateSettings({ media_root, default_event_slug }) {
  const res = await fetch(`${API_BASE}/api/v1/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media_root, default_event_slug }),
  })
  if (!res.ok) throw new Error('Failed to update settings')
  return res.json()
}

export async function browseFolder() {
  const res = await fetch(`${API_BASE}/api/v1/settings/browse-folder`)
  if (!res.ok) throw new Error('Folder picker not available')
  return res.json()
}

export async function listEvents() {
  const res = await fetch(`${API_BASE}/api/v1/settings/events`)
  if (!res.ok) throw new Error('Failed to fetch events')
  return res.json()
}

export async function createEvent(name) {
  const res = await fetch(`${API_BASE}/api/v1/settings/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Failed to create event')
  return res.json()
}

export async function listEventPhotos(slug) {
  const res = await fetch(`${API_BASE}/api/v1/settings/events/${encodeURIComponent(slug)}/photos`)
  if (!res.ok) throw new Error('Failed to fetch photos')
  return res.json()
}

export async function listEventSessions(slug) {
  const res = await fetch(`${API_BASE}/api/v1/settings/events/${encodeURIComponent(slug)}/sessions`)
  if (!res.ok) throw new Error('Failed to fetch sessions')
  return res.json()
}

export async function regenerateSessionToken(sessionId) {
  const res = await fetch(`${API_BASE}/api/v1/settings/sessions/${encodeURIComponent(sessionId)}/regenerate`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error('Failed to regenerate link')
  return res.json()
}
