'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0d0d0d 0%, #111827 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      padding: '24px',
    }}>

      {/* Badge */}
      <div style={{
        fontSize: '10px',
        letterSpacing: '0.25em',
        textTransform: 'uppercase',
        color: '#6366f1',
        border: '1px solid #6366f155',
        borderRadius: '999px',
        padding: '4px 16px',
        marginBottom: '32px',
      }}>
        Final Year Project Demo
      </div>

      {/* Title */}
      <h1 style={{
        margin: '0 0 12px 0',
        fontSize: 'clamp(28px, 5vw, 48px)',
        fontWeight: 700,
        color: '#f9fafb',
        textAlign: 'center',
        lineHeight: 1.15,
        letterSpacing: '-0.02em',
      }}>
        face-auth-kit
      </h1>

      <p style={{
        margin: '0 0 8px 0',
        fontSize: '14px',
        color: '#6b7280',
        textAlign: 'center',
        maxWidth: '480px',
        lineHeight: 1.7,
      }}>
        Facial recognition-based authentication as an importable React component library.
        Powered by AWS Rekognition.
      </p>

      <p style={{
        margin: '0 0 48px 0',
        fontSize: '11px',
        color: '#374151',
        textAlign: 'center',
        letterSpacing: '0.05em',
      }}>
        npm install face-auth-kit
      </p>

      {/* Cards */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/register" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '28px 36px',
            borderRadius: '20px',
            background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
            border: '1px solid #6366f133',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'center',
            minWidth: '180px',
          }}
            onMouseEnter={e => e.currentTarget.style.border = '1px solid #6366f1'}
            onMouseLeave={e => e.currentTarget.style.border = '1px solid #6366f133'}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🪪</div>
            <div style={{ fontSize: '13px', color: '#e5e7eb', letterSpacing: '0.05em' }}>Register</div>
            <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px' }}>Enrol your face</div>
          </div>
        </Link>

        <Link href="/login" style={{ textDecoration: 'none' }}>
          <div style={{
            padding: '28px 36px',
            borderRadius: '20px',
            background: 'linear-gradient(145deg, #1a1a2e, #16213e)',
            border: '1px solid #22c55e33',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textAlign: 'center',
            minWidth: '180px',
          }}
            onMouseEnter={e => e.currentTarget.style.border = '1px solid #22c55e'}
            onMouseLeave={e => e.currentTarget.style.border = '1px solid #22c55e33'}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔓</div>
            <div style={{ fontSize: '13px', color: '#e5e7eb', letterSpacing: '0.05em' }}>Login</div>
            <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '4px' }}>Verify your identity</div>
          </div>
        </Link>
      </div>

      {/* Footer note */}
      <p style={{
        position: 'absolute',
        bottom: '24px',
        fontSize: '10px',
        color: '#374151',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        Design & Implementation of Facial Recognition-Based Authentication · AWS Rekognition
      </p>
    </main>
  )
}
