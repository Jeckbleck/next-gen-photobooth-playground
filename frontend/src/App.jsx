import { usePhotobooth } from './hooks/usePhotobooth'
import { GreetingScreen, CapturingScreen, ReviewScreen } from './components'
import './App.css'

function App() {
  const {
    stage,
    stream,
    error,
    cameraReady,
    videoRef,
    canvasRef,
    photos,
    galleryUrl,
    countdown,
    captureIndex,
    photoCount,
    takePhotos,
    retake,
  } = usePhotobooth()

  return (
    <div className="photobooth-app">
      <canvas ref={canvasRef} className="capture-canvas" aria-hidden />
      <div className="photobooth-container">
        {stage === 'greeting' && (
          <GreetingScreen
            videoRef={videoRef}
            error={error}
            stream={stream}
            cameraReady={cameraReady}
            onTakePhotos={takePhotos}
          />
        )}
        {stage === 'capturing' && (
          <CapturingScreen
            videoRef={videoRef}
            captureIndex={captureIndex}
            photoCount={photoCount}
            countdown={countdown}
          />
        )}
        {stage === 'review' && (
          <ReviewScreen photos={photos} galleryUrl={galleryUrl} onRetake={retake} />
        )}
      </div>
    </div>
  )
}

export default App
