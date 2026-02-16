/**
 * ReviewScreen - Displays captured photos, QR code for sharing, and retake option.
 */
import { QRCodeSVG } from 'qrcode.react'

export function ReviewScreen({ photos, galleryUrl, onRetake }) {
  return (
    <div className="review-screen">
      <h2 className="review-title">Your photos</h2>
      <div className="photos-row">
        {photos.map((url, i) => (
          <div key={i} className="photo-frame">
            <img src={url} alt={`Photo ${i + 1}`} className="review-photo" />
          </div>
        ))}
      </div>
      {galleryUrl && (
        <div className="qr-section">
          <p className="qr-label">Scan to download your photos</p>
          <div className="qr-wrap">
            <QRCodeSVG value={galleryUrl} size={180} level="M" />
          </div>
          <p className="qr-expires">Available for 1 hour</p>
        </div>
      )}
      <button type="button" className="btn-retake" onClick={onRetake}>
        Retake
      </button>
    </div>
  )
}
