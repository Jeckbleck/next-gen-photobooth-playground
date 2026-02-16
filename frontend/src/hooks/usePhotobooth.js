/**
 * usePhotobooth - Composes camera and capture flow.
 * Single entry point for photobooth state and actions.
 */
import { useState } from 'react'
import { useCamera } from './useCamera'
import { usePhotoCapture } from './usePhotoCapture'
import { PHOTO_COUNT } from '../constants/photoBooth'

export function usePhotobooth() {
  const [stage, setStage] = useState('greeting')
  const camera = useCamera(stage)
  const capture = usePhotoCapture(camera, setStage)

  return {
    ...camera,
    ...capture,
    stage,
    photoCount: PHOTO_COUNT,
  }
}
