'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SiriWave from './internal/SiriWave'
import FaceOval from './internal/FaceOval'
import CameraView from './internal/CameraView'
import { useLiveness } from '../hooks/useLiveness'

export default function FaceLogin({
  collectionId,
  onSuccess,
  onError,
  mode = 'liveness',
  apiEndpoint = '/api/face-login',
  livenessApiEndpoint = '/api/face-liveness-check',
  theme = 'dark',
  className = '',
}) {
  const [ovalState, setOvalState] = useState('idle')
  const [waveState, setWaveState] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [cameraReady, setCameraReady] = useState(false)

  const cameraRef = useRef(null)
  const shouldCaptureRef = useRef(false)
  const captureTriggeredRef = useRef(false)

  const isDark = theme === 'dark'

  const { direction, livenessState, progress, start: startLiveness, reset: resetLiveness } = useLiveness({
    apiEndpoint: livenessApiEndpoint,
  })

  // ─── Declared before any useEffect that references it ────────────────────────
  async function handleCapture() {
    const base64 = cameraRef.current?.capture?.()
    if (!base64) {
      setOvalState('error')
      setWaveState('error')
      setErrorMessage('Could not capture image. Please try again.')
      onError?.({ code: 'CAPTURE_FAILED', message: 'Could not capture image.' })
      return
    }

    setOvalState('captured')
    setWaveState('idle')

    setTimeout(async () => {
      setOvalState('loading')
      try {
        const res = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, collectionId }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw { code: data.code || 'API_ERROR', message: data.message || 'Login failed.' }
        }

        setOvalState('success')
        setWaveState('success')
        onSuccess?.(data)
      } catch (err) {
        const code = err.code || 'UNKNOWN_ERROR'

        const friendlyMessages = {
          NO_MATCH:         'Face not recognised. Please try again or check your registration.',
          NO_FACE_DETECTED: 'No face detected. Please position your face clearly in the circle.',
          MULTIPLE_FACES:   'Multiple faces detected. Please ensure only your face is visible.',
          LOW_QUALITY:      'Image quality too low. Ensure good lighting and try again.',
          UNKNOWN_ERROR:    'Something went wrong. Please try again.',
        }

        const error = {
          code,
          message: friendlyMessages[code] || err.message || friendlyMessages.UNKNOWN_ERROR,
        }

        setOvalState('error')
        setWaveState('error')
        setErrorMessage(error.message)
        onError?.(error)
      }
    }, 400)
  }

  // ─── Liveness → UI state: use setTimeout(,0) to avoid synchronous setState in effect ──
  useEffect(() => {
    if (mode !== 'liveness') return

    if (livenessState === 'running') {
      const t = setTimeout(() => {
        setOvalState('scanning')
        setWaveState('scanning')
      }, 0)
      return () => clearTimeout(t)
    }

    if (livenessState === 'passed') {
      shouldCaptureRef.current = true
      captureTriggeredRef.current = false
    }

    if (livenessState === 'failed') {
      const t = setTimeout(() => {
        setOvalState('error')
        setWaveState('error')
        setErrorMessage('Liveness check failed. Please follow the direction prompts.')
      }, 0)
      return () => clearTimeout(t)
    }
  }, [livenessState, mode])

  // ─── Fires handleCapture once when liveness passes (no dep array = runs every render) ──
  useEffect(() => {
    if (shouldCaptureRef.current && !captureTriggeredRef.current) {
      captureTriggeredRef.current = true
      shouldCaptureRef.current = false
      handleCapture()
    }
  })

  function handleCameraReady() {
    setCameraReady(true)
    if (mode === 'liveness') {
      setTimeout(() => startLiveness(cameraRef), 1000)
    } else {
      setOvalState('idle')
      setWaveState('idle')
    }
  }

  function handleRetry() {
    setOvalState('idle')
    setWaveState('idle')
    setErrorMessage('')
    shouldCaptureRef.current = false
    captureTriggeredRef.current = false
    resetLiveness()
    if (mode === 'liveness' && cameraReady) {
      setTimeout(() => startLiveness(cameraRef), 600)
    }
  }

  function handleCameraError(err) {
    setOvalState('error')
    setWaveState('error')
    setErrorMessage(err.message)
    onError?.(err)
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 24px',
        borderRadius: '24px',
        background: isDark
          ? 'linear-gradient(145deg, #0d0d0d, #111827)'
          : 'linear-gradient(145deg, #f9fafb, #ffffff)',
        border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
        boxShadow: isDark
          ? '0 25px 60px rgba(0,0,0,0.6)'
          : '0 25px 60px rgba(0,0,0,0.08)',
        maxWidth: '360px',
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: 'monospace',
        position: 'relative',
      }}
    >
      <p style={{
        margin: '0 0 8px 0',
        fontSize: '11px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: isDark ? '#6b7280' : '#9ca3af',
      }}>
        Face Login
      </p>

      <div style={{ width: '100%', marginBottom: '8px' }}>
        <SiriWave state={waveState} theme={theme} />
      </div>

      <div style={{ position: 'relative', width: '220px', height: '270px', marginBottom: '24px' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <CameraView
            ref={cameraRef}
            active={true}
            theme={theme}
            onReady={handleCameraReady}
            onError={handleCameraError}
          />
        </div>
        <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
          <FaceOval
            state={ovalState}
            direction={direction}
            mode={mode}
            theme={theme}
            onSnap={handleCapture}
          />
        </div>
      </div>

      {mode === 'liveness' && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {['up', 'left', 'right'].map((step, i) => (
            <motion.div
              key={step}
              animate={{
                background: progress > i ? '#6366f1' : isDark ? '#374151' : '#d1d5db',
                scale: progress === i + 1 ? [1, 1.3, 1] : 1,
              }}
              transition={{ duration: 0.3 }}
              style={{ width: '8px', height: '8px', borderRadius: '50%' }}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {errorMessage && (
          <motion.p
            key="error-msg"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{
              margin: '0 0 12px 0',
              fontSize: '12px',
              color: '#f87171',
              textAlign: 'center',
              lineHeight: 1.5,
              maxWidth: '260px',
            }}
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ovalState === 'success' && (
          <motion.p
            key="success-msg"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              margin: '10px 0 12px 0',
              fontSize: '12px',
              color: '#4ade80',
              textAlign: 'center',
              letterSpacing: '0.05em',
            }}
          >
            Identity verified.
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ovalState === 'error' && (
          <motion.button
            key="retry"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleRetry}
            style={{
              padding: '10px 28px',
              borderRadius: '999px',
              border: '2px solid #ef4444',
              background: 'transparent',
              color: '#f87171',
              fontSize: '11px',
              fontFamily: 'monospace',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Try Again
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}