import { useState, useEffect, useCallback } from 'react'
import { usePhotobooth } from './hooks/usePhotobooth'
import {
  GreetingScreen,
  CapturingScreen,
  ReviewScreen,
  PasswordModal,
  SettingsMenu,
  PaymentScreen,
} from './components'
import { getActiveEvent } from './api/settingsApi'
import './App.css'

function App() {
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [paywallEnabled, setPaywallEnabled] = useState(false)

  const {
    stage,
    setStage,
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

  const loadActiveEvent = useCallback(() => {
    getActiveEvent()
      .then((event) => setPaywallEnabled(!!event.paywall_enabled))
      .catch(() => setPaywallEnabled(false))
  }, [])

  useEffect(() => {
    loadActiveEvent()
  }, [loadActiveEvent])

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
    loadActiveEvent()
  }

  function handleTakePhotos() {
    if (paywallEnabled) {
      setStage('payment')
    } else {
      takePhotos()
    }
  }

  function handlePaymentComplete() {
    takePhotos()
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
            onTakePhotos={handleTakePhotos}
            onOpenSettings={handleOpenSettings}
          />
        )}
        {stage === 'payment' && (
          <PaymentScreen
            videoRef={videoRef}
            stream={stream}
            onPaymentComplete={handlePaymentComplete}
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
