/**
 * Session API client.
 * Creates and retrieves photobooth sessions.
 */

const API_BASE = '' // Vite proxy: /api -> backend

/**
 * Create a new session for a capture.
 * @param {string} [eventSlug='onlocation'] - Event identifier
 * @returns {Promise<{id: string, gallery_url: string, token: string}>}
 */
export async function createSession(eventSlug = 'onlocation') {
  const res = await fetch(`${API_BASE}/api/v1/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_slug: eventSlug || 'onlocation' }),
  })
  if (!res.ok) throw new Error('Failed to create session')
  return res.json()
}
