/**
 * usePhotoCapture - Orchestrates the photobooth capture flow.
 * Manages stage, countdown, photo collection, upload, and session.
 */
import { useState, useCallback } from 'react'
import { uploadPhoto } from '../api/photoApi'
import { createSession } from '../api/sessionApi'
import { getSettings } from '../api/settingsApi'
import { COUNTDOWN_SECONDS, PHOTO_COUNT, CAPTURE_DELAY_MS } from '../constants/photoBooth'

const DEFAULT_EVENT = 'onlocation'

export function usePhotoCapture(camera, setStage) {
  const {
    stream,
    videoRef,
    startCamera,
    stopCamera,
    captureFrame,
    setError,
    setCameraReady,
  } = camera
  const [photos, setPhotos] = useState([])
  const [galleryUrl, setGalleryUrl] = useState(null)
  const [countdown, setCountdown] = useState(null)
  const [captureIndex, setCaptureIndex] = useState(0)

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
    setGalleryUrl(null)
    setCaptureIndex(0)

    const currentStream = stream || videoRef.current?.srcObject
    if (!currentStream) {
      const s = await startCamera()
      if (!s) {
        setError('Camera not available')
        setStage('greeting')
        return
      }
    }

    let sessionId = null
    try {
      const settings = await getSettings().catch(() => ({}))
      const eventSlug = settings.default_event_slug || DEFAULT_EVENT
      const session = await createSession(eventSlug)
      sessionId = session.id
      setGalleryUrl(session.gallery_url)
    } catch (e) {
      setError('Failed to create session')
      setStage('greeting')
      return
    }

    const collected = []
    for (let i = 0; i < PHOTO_COUNT; i++) {
      setCaptureIndex(i + 1)
      await runCountdown()
      await new Promise((r) => setTimeout(r, CAPTURE_DELAY_MS))
      const blob = await captureFrame()
      if (!blob) {
        setError('Failed to capture photo')
        stopCamera()
        setStage('greeting')
        return
      }
      try {
        const url = await uploadPhoto(blob, sessionId)
        collected.push(url)
        setPhotos([...collected])
      } catch (e) {
        setError('Failed to save photo')
        stopCamera()
        setStage('greeting')
        return
      }
    }

    stopCamera()
    setStage('review')
  }, [
    stream,
    videoRef,
    startCamera,
    stopCamera,
    runCountdown,
    captureFrame,
    setError,
  ])

  const retake = useCallback(() => {
    setPhotos([])
    setGalleryUrl(null)
    setStage('greeting')
    setCameraReady?.(false)
    // Camera will start via useCamera's effect when stage becomes 'greeting'
  }, [setCameraReady])

  return {
    photos,
    galleryUrl,
    countdown,
    captureIndex,
    takePhotos,
    retake,
  }
}
