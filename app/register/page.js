'use client'

import { useState } from 'react'
import Link from 'next/link'
import FaceRegister from '../../lib/components/FaceRegister'

export default function RegisterPage() {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [mode, setMode] = useState('liveness')

  function handleSuccess(data) {
    setResult(data)
    setError(null)
    // In a real app: save data.faceId to your database against the user
    console.log('[Demo] Registration success. Store this faceId:', data.faceId)
  }

  function handleError(err) {
    setError(err)
    setResult(null)
    console.error('[Demo] Registration error:', err)
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

      {/* The component — this is all consumers need */}
      <FaceRegister
        collectionId="face-auth-demo"
        mode={mode}
        onSuccess={handleSuccess}
        onError={handleError}
        theme="dark"
      />

      {/* Demo result panel — shows what the consumer receives */}
      {result && (
        <div style={{
          padding: '20px 24px',
          borderRadius: '16px',
          background: '#0d1f0d',
          border: '1px solid #22c55e33',
          maxWidth: '360px',
          width: '100%',
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '10px', color: '#22c55e', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            onSuccess received →
          </p>
          <pre style={{ margin: 0, fontSize: '11px', color: '#4ade80', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          <p style={{ margin: '12px 0 0 0', fontSize: '10px', color: '#166534' }}>
            ↑ Save faceId to your DB against this user.
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