/**
 * Photo upload API client.
 * Handles communication with the backend for photo storage.
 */

const API_BASE = '' // Vite proxy: /api -> backend

/**
 * Upload a photo blob to the backend.
 * @param {Blob} blob - Image blob (e.g. from canvas.toBlob)
 * @param {string} [sessionId] - Optional session ID to associate the photo with
 * @returns {Promise<string>} - URL to display the uploaded photo
 */
export async function uploadPhoto(blob, sessionId = null) {
  const formData = new FormData()
  formData.append('file', blob, `photo_${Date.now()}.jpg`)
  if (sessionId) {
    formData.append('session_id', sessionId)
  }
  const res = await fetch(`${API_BASE}/api/v1/photos/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error('Upload failed')
  const data = await res.json()
  return data.url
}
