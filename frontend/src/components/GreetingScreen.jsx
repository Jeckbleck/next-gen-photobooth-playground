/**
 * GreetingScreen - Initial photobooth view with live preview and capture button.
 */
export function GreetingScreen({
  videoRef,
  error,
  stream,
  cameraReady,
  onTakePhotos,
}) {
  return (
    <div className="greeting-screen">
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
