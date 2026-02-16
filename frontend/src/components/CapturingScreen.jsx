/**
 * CapturingScreen - Shows countdown and live preview during photo capture.
 */
export function CapturingScreen({
  videoRef,
  captureIndex,
  photoCount,
  countdown,
}) {
  return (
    <div className="capturing-screen">
      <h2 className="capture-title">
        Photo {captureIndex} of {photoCount}
      </h2>
      <div className="preview-wrap">
        <video ref={videoRef} autoPlay playsInline muted className="preview-video" />
        {countdown !== null && <div className="countdown-overlay">{countdown}</div>}
      </div>
      <p className="capture-hint">
        {countdown !== null ? 'Get ready...' : 'Capturing...'}
      </p>
    </div>
  )
}
