/**
 * SessionDetailModal - View a photo set in detail with QR code.
 * A fresh short-lived QR is generated each time the modal opens.
 */
import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { regenerateSessionToken } from '../api/settingsApi'

export function SessionDetailModal({ session, onClose }) {
  const [galleryUrl, setGalleryUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  const photos = session?.photo_urls || []

  useEffect(() => {
    if (!session?.id) {
      setLoading(false)
      return
    }
    regenerateSessionToken(session.id)
      .then((updated) => setGalleryUrl(updated.gallery_url))
      .catch(() => setGalleryUrl(null))
      .finally(() => setLoading(false))
  }, [session?.id])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content session-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="session-detail-header">
          <h2 className="session-detail-title">Photo set</h2>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="session-detail-photos">
          {photos.map((url, i) => (
            <div key={i} className="session-detail-photo-frame">
              <img src={url} alt={`Photo ${i + 1}`} />
            </div>
          ))}
        </div>

        <div className="session-detail-qr">
          <p className="qr-label">Scan to download your photos</p>
          {loading ? (
            <div className="qr-wrap qr-loading">Generating link…</div>
          ) : galleryUrl ? (
            <>
              <div className="qr-wrap">
                <QRCodeSVG value={galleryUrl} size={200} level="M" />
              </div>
              <p className="qr-expires">Available for 1 hour</p>
            </>
          ) : (
            <p className="qr-expired">Could not generate link</p>
          )}
        </div>

        <div className="session-detail-actions">
          <button type="button" className="btn-modal-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
