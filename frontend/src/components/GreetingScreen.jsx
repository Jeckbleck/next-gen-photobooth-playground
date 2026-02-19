/**
 * GreetingScreen - Initial photobooth view with live preview and capture button.
 */
export function GreetingScreen({
  videoRef,
  error,
  stream,
  cameraReady,
  onTakePhotos,
  onOpenSettings,
}) {
  return (
    <div className="greeting-screen">
      <button
        type="button"
        className="btn-settings-lock"
        onClick={onOpenSettings}
        aria-label="Open settings"
        title="Settings"
      >
        <LockIcon />
      </button>
      <h1 className="greeting-title">Welcome to the Photobooth</h1>
      <p className="greeting-subtitle">Get ready for 3 photos. Smile!</p>
      <div className="preview-wrap">
        {error && <p className="error-message">{error}</p>}
        {!stream && !error && <p className="camera-loading">Loading camera…</p>}
        <video ref={videoRef} autoPlay playsInline muted className="preview-video" />
      </div>
      <button
        type="button"
        className="btn-capture"
        onClick={onTakePhotos}
        disabled={!!error || !cameraReady}
      >
        Take 3 Photos
      </button>
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
  )
}
