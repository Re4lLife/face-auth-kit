'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * FaceOval
 * Props:
 *  - state: 'idle' | 'scanning' | 'captured' | 'loading' | 'success' | 'error'
 *  - direction: null | 'up' | 'left' | 'right'   (liveness prompt, shown during scanning)
 *  - mode: 'liveness' | 'photo'
 *  - theme: 'dark' | 'light'
 *  - onSnap: () => void   (called when user presses snap in photo mode)
 */

const STATE_STYLES = {
  idle:     { border: '#4b5563', glow: 'rgba(75,85,99,0.0)',    label: 'Position your face in the circle' },
  scanning: { border: '#6366f1', glow: 'rgba(99,102,241,0.35)', label: 'Hold still...' },
  captured: { border: '#8b5cf6', glow: 'rgba(139,92,246,0.4)',  label: 'Processing...' },
  loading:  { border: '#8b5cf6', glow: 'rgba(139,92,246,0.4)',  label: 'Please wait...' },
  success:  { border: '#22c55e', glow: 'rgba(34,197,94,0.45)',  label: 'Verified!' },
  error:    { border: '#ef4444', glow: 'rgba(239,68,68,0.45)',  label: 'Try again' },
}

const DIRECTION_ARROWS = {
  up:    { symbol: '↑', label: 'Look up',   style: { top: '-48px', left: '50%', transform: 'translateX(-50%)' } },
  left:  { symbol: '←', label: 'Look left', style: { left: '-56px', top: '50%', transform: 'translateY(-50%)' } },
  right: { symbol: '→', label: 'Look right',style: { right: '-56px', top: '50%', transform: 'translateY(-50%)' } },
}

export default function FaceOval({
  state = 'idle',
  direction = null,
  mode = 'liveness',
  theme = 'dark',
  onSnap,
}) {
  const style = STATE_STYLES[state] || STATE_STYLES.idle
  const isDark = theme === 'dark'

  const isLoading = state === 'captured' || state === 'loading'
  const isSuccess = state === 'success'
  const isError = state === 'error'
  const isIdle = state === 'idle'
  const isScanning = state === 'scanning'

  const showSnap = mode === 'photo' && (isIdle || isScanning)
  const showDirection = mode === 'liveness' && isScanning && direction

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>

      {/* Oval container */}
      <div style={{ position: 'relative', width: '220px', height: '270px' }}>

        {/* Glow layer */}
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: '-12px',
            borderRadius: '50%',
            background: style.glow,
            filter: 'blur(18px)',
            zIndex: 0,
          }}
        />

        {/* The oval itself */}
        <motion.div
          animate={{ borderColor: style.border }}
          transition={{ duration: 0.5 }}
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: `3px solid ${style.border}`,
            overflow: 'hidden',
            zIndex: 1,
            background: isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(4px)',
            boxSizing: 'border-box',
          }}
        >
          {/* Scanning sweep animation */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                key="sweep"
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: `conic-gradient(from 0deg, transparent 70%, ${style.border}55 100%)`,
                }}
              />
            )}
          </AnimatePresence>

          {/* Loading spinner */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                key="spinner"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ opacity: { duration: 0.3 }, rotate: { duration: 1, repeat: Infinity, ease: 'linear' } }}
                style={{
                  position: 'absolute',
                  inset: '10px',
                  borderRadius: '50%',
                  border: '3px solid transparent',
                  borderTopColor: '#8b5cf6',
                  borderRightColor: '#8b5cf6',
                }}
              />
            )}
          </AnimatePresence>

          {/* Success tick */}
          <AnimatePresence>
            {isSuccess && (
              <motion.div
                key="tick"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '64px',
                }}
              >
                ✓
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error X */}
          <AnimatePresence>
            {isError && (
              <motion.div
                key="cross"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '64px',
                  color: '#ef4444',
                }}
              >
                ✗
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Direction arrows — liveness mode only, outside the oval */}
        <AnimatePresence>
          {showDirection && DIRECTION_ARROWS[direction] && (
            <motion.div
              key={direction}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                position: 'absolute',
                ...DIRECTION_ARROWS[direction].style,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                zIndex: 10,
              }}
            >
              <motion.span
                animate={{ y: direction === 'up' ? [-4, 4, -4] : 0, x: direction === 'left' ? [-4, 4, -4] : direction === 'right' ? [4, -4, 4] : 0 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  fontSize: '28px',
                  color: '#6366f1',
                  filter: 'drop-shadow(0 0 8px #6366f1)',
                  lineHeight: 1,
                }}
              >
                {DIRECTION_ARROWS[direction].symbol}
              </motion.span>
              <span style={{
                fontSize: '10px',
                color: isDark ? '#a5b4fc' : '#4338ca',
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap',
              }}>
                {DIRECTION_ARROWS[direction].label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={state}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          style={{
            margin: 0,
            fontSize: '13px',
            fontFamily: 'monospace',
            letterSpacing: '0.08em',
            color: isDark ? '#9ca3af' : '#6b7280',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}
        >
          {style.label}
        </motion.p>
      </AnimatePresence>

      {/* Snap button — photo mode only */}
      <AnimatePresence>
        {showSnap && (
          <motion.button
            key="snap"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSnap}
            style={{
              marginTop: '4px',
              padding: '10px 32px',
              borderRadius: '999px',
              border: '2px solid #6366f1',
              background: 'transparent',
              color: isDark ? '#a5b4fc' : '#4338ca',
              fontSize: '12px',
              fontFamily: 'monospace',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            Capture
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}