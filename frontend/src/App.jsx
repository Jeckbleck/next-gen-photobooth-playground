import { useState, useRef, useCallback, useEffect } from 'react'
import './App.css'

const API_BASE = '' // use Vite proxy: /api -> backend
const COUNTDOWN_SECONDS = 3
const PHOTO_COUNT = 3
const CAPTURE_DELAY_MS = 800 // delay between countdown and actual capture

function App() {
  const [stage, setStage] = useState('greeting') // 'greeting' | 'capturing' | 'review'
  const [stream, setStream] = useState(null)
  const [photos, setPhotos] = useState([]) // array of image URLs
  const [countdown, setCountdown] = useState(null)
  const [captureIndex, setCaptureIndex] = useState(0)
  const [error, setError] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  // Start camera for live preview
  const startCamera = useCallback(async () => {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera not supported in this browser. Use Chrome, Edge, or Firefox over HTTP or HTTPS.')
      return null
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      })
      streamRef.current = mediaStream
      setStream(mediaStream)
      setCameraReady(true)
      return mediaStream
    } catch (err) {
      streamRef.current = null
      setCameraReady(false)
      const name = err?.name || ''
      const msg =
        name === 'NotAllowedError' || name === 'PermissionDeniedError'
          ? 'Camera access was denied. Please allow camera permission and refresh.'
          : name === 'NotFoundError'
            ? 'No camera found. Please connect a camera and try again.'
            : name === 'NotReadableError'
              ? 'Camera is in use by another app. Close other apps using the camera.'
              : 'Could not access camera. Please allow camera access and try again.'
      setError(msg)
      console.error('getUserMedia error:', err)
      return null
    }
  }, [])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setStream(null)
    }
  }, [])

  // Keep streamRef in sync
  useEffect(() => {
    streamRef.current = stream
  }, [stream])

  // Start camera when on greeting screen
  useEffect(() => {
    if (stage === 'greeting') startCamera()
  }, [stage, startCamera])

  // Stop camera only on unmount (ref-based to avoid Strict Mode / effect deps stopping the stream)
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [])

  // Attach stream to video whenever we have a video element and a stream (re-run when stage changes so capturing screen's video gets the stream)
  useEffect(() => {
    if (!videoRef.current || !stream) return
    const video = videoRef.current
    video.srcObject = stream
    const p = video.play()
    if (p && typeof p.then === 'function') p.catch(() => {})
  }, [stream, stage])

  const captureFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return null
    const w = video.videoWidth
    const h = video.videoHeight
    if (!w || !h) return null
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    // Mirror so saved photo matches the preview (which is mirrored)
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, w, h)
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.92
      )
    })
  }, [])

  const uploadPhoto = useCallback(async (blob) => {
    const formData = new FormData()
    formData.append('file', blob, `photo_${Date.now()}.jpg`)
    const res = await fetch(`${API_BASE}/api/v1/photos/upload`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) throw new Error('Upload failed')
    const data = await res.json()
    return data.url
  }, [])

  const runCountdown = useCallback(() => {
    return new Promise((resolve) => {
      let n = COUNTDOWN_SECONDS
      setCountdown(n)
      const iv = setInterval(() => {
        n -= 1
        if (n <= 0) {
          clearInterval(iv)
          setCountdown(null)
          resolve()
          return
        }
        setCountdown(n)
      }, 1000)
    })
  }, [])

  const takePhotos = useCallback(async () => {
    setError(null)
    setStage('capturing')
    setPhotos([])
    setCaptureIndex(0)

    // Ensure stream is attached (still on greeting page with video)
    if (!stream && videoRef.current?.srcObject) {
      setStream(videoRef.current.srcObject)
    }
    const currentStream = stream || videoRef.current?.srcObject
    if (!currentStream) {
      const s = await startCamera()
      if (!s) {
        setError('Camera not available')
        setStage('greeting')
        return
      }
    }

    const collected = []
    for (let i = 0; i < PHOTO_COUNT; i++) {
      setCaptureIndex(i + 1)
      await runCountdown()
      await new Promise((r) => setTimeout(r, CAPTURE_DELAY_MS))
      const blob = await captureFrame()
      if (!blob) {
        setError('Failed to capture photo')
        setStage('greeting')
        return
      }
      try {
        const url = await uploadPhoto(blob)
        collected.push(url)
        setPhotos([...collected])
      } catch (e) {
        setError('Failed to save photo')
        setStage('greeting')
        return
      }
    }

    stopCamera()
    setStage('review')
  }, [stream, startCamera, stopCamera, runCountdown, captureFrame, uploadPhoto])

  const retake = useCallback(() => {
    setPhotos([])
    setStage('greeting')
    setCameraReady(false)
    startCamera()
  }, [startCamera])

  return (
    <div className="photobooth-app">
      {/* Persistent hidden canvas for capture (must stay mounted during capturing stage) */}
      <canvas ref={canvasRef} className="capture-canvas" aria-hidden />
      <div className="photobooth-container">
        {stage === 'greeting' && (
          <div className="greeting-screen">
            <h1 className="greeting-title">Welcome to the Photobooth</h1>
            <p className="greeting-subtitle">Get ready for 3 photos. Smile!</p>
            <div className="preview-wrap">
              {error && <p className="error-message">{error}</p>}
              {!stream && !error && <p className="camera-loading">Loading camera…</p>}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="preview-video"
              />
            </div>
            <button type="button" className="btn-capture" onClick={takePhotos} disabled={!!error || !cameraReady}>
              Take 3 Photos
            </button>
          </div>
        )}

        {stage === 'capturing' && (
          <div className="capturing-screen">
            <h2 className="capture-title">
              Photo {captureIndex} of {PHOTO_COUNT}
            </h2>
            <div className="preview-wrap">
              <video ref={videoRef} autoPlay playsInline muted className="preview-video" />
              {countdown !== null && <div className="countdown-overlay">{countdown}</div>}
            </div>
            <p className="capture-hint">{countdown !== null ? 'Get ready...' : 'Capturing...'}</p>
          </div>
        )}

        {stage === 'review' && (
          <div className="review-screen">
            <h2 className="review-title">Your photos</h2>
            <div className="photos-row">
              {photos.map((url, i) => (
                <div key={i} className="photo-frame">
                  <img src={url} alt={`Photo ${i + 1}`} className="review-photo" />
                </div>
              ))}
            </div>
            <button type="button" className="btn-retake" onClick={retake}>
              Retake
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
