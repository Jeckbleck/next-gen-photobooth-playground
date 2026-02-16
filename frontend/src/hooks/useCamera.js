/**
 * useCamera - Manages camera stream, preview, and frame capture.
 * Handles getUserMedia, stream lifecycle, and canvas-based capture.
 */
import { useState, useRef, useCallback, useEffect } from 'react'

function getCameraErrorMessage(err) {
  const name = err?.name || ''
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return 'Camera access was denied. Please allow camera permission and refresh.'
  }
  if (name === 'NotFoundError') {
    return 'No camera found. Please connect a camera and try again.'
  }
  if (name === 'NotReadableError') {
    return 'Camera is in use by another app. Close other apps using the camera.'
  }
  return 'Could not access camera. Please allow camera access and try again.'
}

export function useCamera(stage = 'greeting') {
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const startCamera = useCallback(async () => {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        'Camera not supported in this browser. Use Chrome, Edge, or Firefox over HTTP or HTTPS.'
      )
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
      setError(getCameraErrorMessage(err))
      console.error('getUserMedia error:', err)
      return null
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setStream(null)
    }
  }, [])

  useEffect(() => {
    streamRef.current = stream
  }, [stream])

  // Start camera when on greeting screen (initial load + after retake)
  useEffect(() => {
    if (stage === 'greeting') {
      startCamera()
    }
  }, [stage, startCamera])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [])

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
    ctx.translate(w, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, w, h)
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92)
    })
  }, [])

  return {
    stream,
    error,
    cameraReady,
    videoRef,
    canvasRef,
    startCamera,
    stopCamera,
    captureFrame,
    setError,
    setCameraReady,
  }
}
