'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { FaceLivenessDetectorCore } from '@aws-amplify/ui-react-liveness'
import '@aws-amplify/ui-react/styles.css'
import SiriWave from './internal/SiriWave'

const FRIENDLY_ERRORS = {
  NO_MATCH:             'Face not recognised. Please try again or re-register.',
  NO_FACE_DETECTED:     'No face detected. Please ensure your face is clearly visible.',
  NO_REFERENCE_IMAGE:   'Could not capture your face. Please try again in better lighting.',
  LIVENESS_FAILED:      'Liveness check failed. Please try again.',
  SESSION_EXPIRED:      'Session expired. Please try again.',
  SESSION_CREATE_ERROR: 'Could not start liveness session. Check your connection and try again.',
  MISSING_ROLE_ARN:     'Server configuration error. Please contact support.',
  AWS_ERROR:            'Something went wrong. Please try again.',
}

export default function FaceLogin({
  collectionId,
  onSuccess,
  onError,
  sessionApiEndpoint = '/api/face-liveness-session',
  resultApiEndpoint  = '/api/face-liveness-result',
  theme = 'dark',
  className = '',
}) {
  const [phase, setPhase]               = useState('init')
  const [sessionData, setSessionData]   = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [waveState, setWaveState]       = useState('idle')
  const [clockOffset, setClockOffset]   = useState(0)

  const isDark = theme === 'dark'
  const sessionStarted = useRef(false)

  // ─── handleError declared first ──────────────────────────────────────────────
  const handleError = useCallback((error) => {
    setPhase('error')
    setWaveState('error')
    setErrorMessage(error.message)
    onError?.(error)
  }, [onError])

  // ─── Start session ────────────────────────────────────────────────────────────
const startSession = useCallback(async () => {
  sessionStarted.current = true
  setPhase('init')
  setErrorMessage('')
  setWaveState('scanning')

  try {
    const before = Date.now()
    const res = await fetch(sessionApiEndpoint, { method: 'POST' })
    const data = await res.json()

    if (!res.ok) throw { code: data.code, message: data.message }

    const rtt = Date.now() - before
    setClockOffset(rtt > 5 * 60 * 1000 ? rtt : 0)

    setSessionData(data)
    setPhase('liveness')
  } catch (err) {
    const code = err.code || 'SESSION_CREATE_ERROR'
    handleError({ code, message: FRIENDLY_ERRORS[code] || err.message })
  }
}, [sessionApiEndpoint, handleError])

  // ─── Kick off on mount — guard prevents double-fire in React strict mode ──────
  useEffect(() => {
    if (sessionStarted.current) return
    sessionStarted.current = true
    const t = setTimeout(() => { startSession() }, 0)
    return () => clearTimeout(t)
  }, [startSession])

  // ─── Amplify complete → fetch result ─────────────────────────────────────────
  async function handleAnalysisComplete() {
    setPhase('processing')
    setWaveState('scanning')

    try {
      const res = await fetch(resultApiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionData.sessionId, collectionId, mode: 'login' }),
      })
      const data = await res.json()
      if (!res.ok) throw { code: data.code, message: data.message }
      setPhase('success')
      setWaveState('success')
      onSuccess?.(data)
    } catch (err) {
      const code = err.code || 'AWS_ERROR'
      handleError({ code, message: FRIENDLY_ERRORS[code] || err.message })
    }
  }

  // ─── Amplify liveness error ───────────────────────────────────────────────────
  function handleLivenessError(err) {
    if (err?.state === 'CONNECTION_TIMEOUT' || err?.state === 'SERVER_ERROR') {
      handleError({ code: 'SESSION_EXPIRED', message: FRIENDLY_ERRORS['SESSION_EXPIRED'] })
      return
    }
    handleError({ code: err?.state || 'LIVENESS_FAILED', message: FRIENDLY_ERRORS['LIVENESS_FAILED'] })
  }

  // ─── Credential provider for Amplify ─────────────────────────────────────────
  // clockOffset read here (inside async function) — not during render
  const credentialProvider = async () => ({
    accessKeyId:     sessionData.credentials.accessKeyId,
    secretAccessKey: sessionData.credentials.secretAccessKey,
    sessionToken:    sessionData.credentials.sessionToken,
  })

  return (
    <div
      className={className}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '32px 24px', borderRadius: '24px',
        background: isDark ? 'linear-gradient(145deg, #0d0d0d, #111827)' : 'linear-gradient(145deg, #f9fafb, #ffffff)',
        border: `1px solid ${isDark ? '#1f2937' : '#e5e7eb'}`,
        boxShadow: isDark ? '0 25px 60px rgba(0,0,0,0.6)' : '0 25px 60px rgba(0,0,0,0.08)',
        maxWidth: '400px', width: '100%', boxSizing: 'border-box', fontFamily: 'monospace',
      }}
    >
      <p style={{ margin: '0 0 8px 0', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: isDark ? '#6b7280' : '#9ca3af' }}>
        Face Login
      </p>

      <div style={{ width: '100%', marginBottom: '16px' }}>
        <SiriWave state={waveState} theme={theme} />
      </div>

      {phase === 'init' && (
        <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <Spinner />
          <p style={{ margin: 0, fontSize: '12px', color: isDark ? '#6b7280' : '#9ca3af', letterSpacing: '0.08em' }}>Starting session...</p>
        </div>
      )}

      {phase === 'liveness' && sessionData && (
        <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
          <FaceLivenessDetectorCore
            sessionId={sessionData.sessionId}
            region={sessionData.region}
            onAnalysisComplete={handleAnalysisComplete}
            onError={handleLivenessError}
            config={{
              credentialProvider,
              systemClockOffset: clockOffset,
            }}
          />
        </div>
      )}

      {phase === 'processing' && (
        <StatusCard icon={<Spinner />} message="Verifying your identity..." isDark={isDark} />
      )}

      {phase === 'success' && (
        <StatusCard icon={<span style={{ fontSize: '48px' }}>✓</span>} iconColor="#22c55e" message="Identity verified." isDark={isDark} />
      )}

      {phase === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '24px 0' }}>
          <span style={{ fontSize: '48px' }}>✗</span>
          <p style={{ margin: 0, fontSize: '12px', color: '#f87171', textAlign: 'center', maxWidth: '280px', lineHeight: 1.6 }}>
            {errorMessage}
          </p>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
            onClick={() => { sessionStarted.current = false; startSession() }}
            style={{ padding: '10px 28px', borderRadius: '999px', border: '2px solid #ef4444', background: 'transparent', color: '#f87171', fontSize: '11px', fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Try Again
          </motion.button>
        </div>
      )}
    </div>
  )
}

function StatusCard({ icon, iconColor = 'inherit', message, isDark }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 0' }}>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} style={{ color: iconColor }}>
        {icon}
      </motion.div>
      <p style={{ margin: 0, fontSize: '12px', color: isDark ? '#9ca3af' : '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {message}
      </p>
    </div>
  )
}

function Spinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#6366f1', borderRightColor: '#6366f1' }}
    />
  )
}