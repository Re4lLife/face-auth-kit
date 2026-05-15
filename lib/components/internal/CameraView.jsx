'use client'

import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import Webcam from 'react-webcam'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * CameraView
 * Wraps react-webcam. Exposes a `capture()` method via ref.
 *
 * Props:
 *  - active: boolean           — mounts/unmounts the webcam
 *  - theme: 'dark' | 'light'
 *  - onReady: () => void       — called when camera stream is ready
 *  - onError: (err) => void    — called on camera permission error
 *
 * Ref methods:
 *  - capture() → base64 string (jpeg)  — takes a still from the stream
 *  - getVideoElement() → HTMLVideoElement
 */

const VIDEO_CONSTRAINTS = {
  width: 640,
  height: 480,
  facingMode: 'user',
}

const CameraView = forwardRef(function CameraView(
  { active = true, theme = 'dark', onReady, onError },
  ref
) {
  const webcamRef = useRef(null)
  const isDark = theme === 'dark'

  useImperativeHandle(ref, () => ({
    capture() {
      if (!webcamRef.current) return null
      // getScreenshot returns base64 jpeg by default
      return webcamRef.current.getScreenshot()
    },
    getVideoElement() {
      return webcamRef.current?.video || null
    },
  }))

  const handleUserMedia = () => {
    if (onReady) onReady()
  }

  const handleUserMediaError = (err) => {
    if (onError) onError({
      code: 'CAMERA_ERROR',
      message: err?.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access.'
        : 'Camera not available or could not be started.',
    })
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '220px',
        height: '270px',
        borderRadius: '50%',
        overflow: 'hidden',
        background: isDark ? '#0f0f0f' : '#f3f4f6',
        flexShrink: 0,
      }}
    >
      <AnimatePresence>
        {active && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={0.92}
              videoConstraints={VIDEO_CONSTRAINTS}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              mirrored={true}
              style={{
                position: 'absolute',
                // Stretch to fill the oval fully — crop what overflows
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Placeholder when camera not yet active */}
      <AnimatePresence>
        {!active && (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
                fill={isDark ? '#374151' : '#d1d5db'}
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default CameraView