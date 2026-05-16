'use client'

import { useState } from 'react'
import Link from 'next/link'
import FaceRegister from '../../lib/components/FaceRegister'

export default function RegisterPage() {
  const [result, setResult] = useState(null)
  const [error, setError]   = useState(null)

  function handleSuccess(data) {
    setResult(data)
    setError(null)
    // In a real app: save data.faceId to your DB against the user
    console.log('[Demo] Store this faceId against your user:', data.faceId)
  }

  function handleError(err) {
    setError(err)
    setResult(null)
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0d0d 0%, #111827 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'monospace', padding: '24px', gap: '32px',
    }}>
      <Link href="/" style={{ position: 'absolute', top: '24px', left: '24px', fontSize: '11px', color: '#4b5563', textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        ← Back
      </Link>

      <FaceRegister
        collectionId="face-auth-demo"
        onSuccess={handleSuccess}
        onError={handleError}
        theme="dark"
      />

      {result && (
        <div style={{ padding: '20px 24px', borderRadius: '16px', background: '#0d1f0d', border: '1px solid #22c55e33', maxWidth: '400px', width: '100%' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '10px', color: '#22c55e', letterSpacing: '0.15em', textTransform: 'uppercase' }}>onSuccess received →</p>
          <pre style={{ margin: 0, fontSize: '11px', color: '#4ade80', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
          <p style={{ margin: '12px 0 0 0', fontSize: '10px', color: '#166534' }}>↑ Save faceId to your DB against this user.</p>
        </div>
      )}

      {error && (
        <div style={{ padding: '20px 24px', borderRadius: '16px', background: '#1f0d0d', border: '1px solid #ef444433', maxWidth: '400px', width: '100%' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '10px', color: '#ef4444', letterSpacing: '0.15em', textTransform: 'uppercase' }}>onError received →</p>
          <pre style={{ margin: 0, fontSize: '11px', color: '#f87171', lineHeight: 1.7 }}>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
    </main>
  )
}