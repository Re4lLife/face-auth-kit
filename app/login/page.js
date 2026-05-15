'use client'

import { useState } from 'react'
import Link from 'next/link'
import FaceLogin from '../../lib/components/FaceLogin'

// Demo threshold — in a real app the consumer sets this themselves
const SIMILARITY_THRESHOLD = 90

export default function LoginPage() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [authStatus, setAuthStatus] = useState(null) // 'granted' | 'denied'
  const [mode, setMode] = useState('liveness')

  function handleSuccess(data) {
    setResult(data)
    setError(null)

    // Consumer decides the threshold — this is their code, not the library's
    if (data.similarity >= SIMILARITY_THRESHOLD) {
      setAuthStatus('granted')
      console.log('[Demo] Access granted. Look up faceId in your DB:', data.faceId)
    } else {
      setAuthStatus('denied')
      console.log('[Demo] Similarity too low:', data.similarity)
    }
  }

  function handleError(err) {
    setError(err)
    setResult(null)
    setAuthStatus(null)
    console.error('[Demo] Login error:', err)
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0edd0d 0%, #111827 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      padding: '24px',
      gap: '32px',
    }}>

      {/* Back */}
      <Link href="/" style={{
        position: 'absolute',
        top: '24px',
        left: '24px',
        fontSize: '11px',
        color: '#4b5563',
        textDecoration: 'none',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}>
        ← Back
      </Link>

      {/* Mode toggle */}
      <div style={{
        display: 'flex',
        gap: '0',
        border: '1px solid #1f2937',
        borderRadius: '999px',
        overflow: 'hidden',
        position: 'absolute',
        top: '24px',
        right: '24px',
      }}>
        {['liveness', 'photo'].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '6px 18px',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              border: 'none',
              cursor: 'pointer',
              background: mode === m ? '#6366f1' : 'transparent',
              color: mode === m ? '#fff' : '#4b5563',
              transition: 'all 0.2s',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Threshold info */}
      <div style={{
        fontSize: '10px',
        color: '#374151',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        position: 'absolute',
        top: '60px',
        right: '24px',
      }}>
        Threshold: {SIMILARITY_THRESHOLD}%
      </div>

      {/* The component — this is all consumers need */}
      <FaceLogin
        collectionId="face-auth-demo"
        mode={mode}
        onSuccess={handleSuccess}
        onError={handleError}
        theme="dark"
      />

      {/* Auth status banner */}
      {authStatus === 'granted' && (
        <div style={{
          padding: '14px 28px',
          borderRadius: '999px',
          background: '#0d1f0d',
          border: '1px solid #22c55e',
          fontSize: '12px',
          color: '#4ade80',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          ✓ Access Granted — similarity {result?.similarity?.toFixed(1)}%
        </div>
      )}

      {authStatus === 'denied' && (
        <div style={{
          padding: '14px 28px',
          borderRadius: '999px',
          background: '#1f0d0d',
          border: '1px solid #ef4444',
          fontSize: '12px',
          color: '#f87171',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}>
          ✗ Access Denied — similarity {result?.similarity?.toFixed(1)}% &lt; {SIMILARITY_THRESHOLD}%
        </div>
      )}

      {/* Demo result panel */}
      {result && (
        <div style={{
          padding: '20px 24px',
          borderRadius: '16px',
          background: '#0a0a1a',
          border: '1px solid #1f2937',
          maxWidth: '360px',
          width: '100%',
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '10px', color: '#6366f1', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            onSuccess received →
          </p>
          <pre style={{ margin: 0, fontSize: '11px', color: '#a5b4fc', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          <p style={{ margin: '12px 0 0 0', fontSize: '10px', color: '#312e81' }}>
            ↑ Look up faceId in your DB to identify the user. You set the threshold.
          </p>
        </div>
      )}

      {error && (
        <div style={{
          padding: '20px 24px',
          borderRadius: '16px',
          background: '#1f0d0d',
          border: '1px solid #ef444433',
          maxWidth: '360px',
          width: '100%',
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '10px', color: '#ef4444', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            onError received →
          </p>
          <pre style={{ margin: 0, fontSize: '11px', color: '#f87171', lineHeight: 1.7 }}>
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )}
    </main>
  )
}