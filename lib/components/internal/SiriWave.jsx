'use client'

import { useEffect, useRef } from 'react'

/**
 * SiriWave
 * Props:
 *  - state: 'idle' | 'scanning' | 'success' | 'error'
 *  - theme: 'dark' | 'light'
 */

const STATES = {
  idle: {
    speed: 0.03,
    amplitude: 0.3,
    waves: [
      { color: '#3b82f6', alpha: 0.5, frequency: 3, offset: 0 },
      { color: '#60a5fa', alpha: 0.25, frequency: 5, offset: 1 },
    ],
  },
  scanning: {
    speed: 0.09,
    amplitude: 0.65,
    waves: [
      { color: '#6366f1', alpha: 0.7, frequency: 3, offset: 0 },
      { color: '#8b5cf6', alpha: 0.5, frequency: 4, offset: 0.8 },
      { color: '#06b6d4', alpha: 0.4, frequency: 6, offset: 1.6 },
      { color: '#3b82f6', alpha: 0.3, frequency: 2, offset: 2.4 },
    ],
  },
  success: {
    speed: 0.04,
    amplitude: 0.2,
    waves: [
      { color: '#22c55e', alpha: 0.6, frequency: 3, offset: 0 },
      { color: '#4ade80', alpha: 0.3, frequency: 5, offset: 1 },
    ],
  },
  error: {
    speed: 0.04,
    amplitude: 0.2,
    waves: [
      { color: '#ef4444', alpha: 0.6, frequency: 3, offset: 0 },
      { color: '#f87171', alpha: 0.3, frequency: 5, offset: 1 },
    ],
  },
}

export default function SiriWave({ state = 'idle', theme = 'dark' }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const phaseRef = useRef(0)
  const currentAmplitudeRef = useRef(STATES.idle.amplitude)
  const currentSpeedRef = useRef(STATES.idle.speed)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)

    const config = STATES[state] || STATES.idle

    // Smoothly interpolate amplitude and speed toward target
    const lerp = (a, b, t) => a + (b - a) * t

    const draw = () => {
      const W = canvas.offsetWidth
      const H = canvas.offsetHeight

      ctx.clearRect(0, 0, W, H)

      // Smoothly approach target values
      currentAmplitudeRef.current = lerp(currentAmplitudeRef.current, config.amplitude, 0.05)
      currentSpeedRef.current = lerp(currentSpeedRef.current, config.speed, 0.05)

      phaseRef.current += currentSpeedRef.current

      config.waves.forEach((wave) => {
        ctx.beginPath()
        ctx.moveTo(0, H / 2)

        for (let x = 0; x <= W; x += 1) {
          const normalX = (x / W) * Math.PI * 2
          const y =
            H / 2 +
            Math.sin(normalX * wave.frequency + phaseRef.current + wave.offset) *
              (H / 2) *
              currentAmplitudeRef.current *
              // Envelope: fade the wave at edges so it "breathes" from centre
              Math.sin((x / W) * Math.PI)

          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }

        ctx.strokeStyle = hexToRgba(wave.color, wave.alpha)
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()
      })

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [state])

  const bgColor = theme === 'dark' ? 'transparent' : 'transparent'

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '80px',
        display: 'block',
        background: bgColor,
      }}
    />
  )
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}