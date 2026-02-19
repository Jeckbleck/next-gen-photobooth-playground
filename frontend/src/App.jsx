import { useState } from 'react'
import { usePhotobooth } from './hooks/usePhotobooth'
import { GreetingScreen, CapturingScreen, ReviewScreen, PasswordModal, SettingsMenu } from './components'
import './App.css'

function App() {
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)

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

  const handleOpenSettings = () => setShowPasswordModal(true)
  const [unlockedPassword, setUnlockedPassword] = useState(null)
  const handlePasswordSuccess = (password) => {
    setShowPasswordModal(false)
    setUnlockedPassword(password)
    setShowSettingsMenu(true)
  }
  const handlePasswordCancel = () => setShowPasswordModal(false)
  const handleSettingsClose = () => {
    setShowSettingsMenu(false)
    setUnlockedPassword(null)
  }

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
            onOpenSettings={handleOpenSettings}
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

      {showPasswordModal && (
        <PasswordModal onSuccess={handlePasswordSuccess} onCancel={handlePasswordCancel} />
      )}
      {showSettingsMenu && (
        <SettingsMenu
          onClose={handleSettingsClose}
          currentPassword={unlockedPassword}
        />
      )}
    </div>
  )
}

export default App
