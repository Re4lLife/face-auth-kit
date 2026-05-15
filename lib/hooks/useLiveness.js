'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * useLiveness
 *
 * Drives the liveness challenge sequence: up → left → right.
 * Uses the video element from CameraView to sample frames and detect
 * head pose changes via AWS Rekognition DetectFaces (called through
 * the consumer's API route).
 *
 * Returns:
 *  - direction: null | 'up' | 'left' | 'right'   current prompt
 *  - livenessState: 'idle' | 'running' | 'passed' | 'failed'
 *  - progress: 0–3 (how many steps completed)
 *  - start(cameraRef): begin the challenge
 *  - reset(): reset everything back to idle
 */

const SEQUENCE = ['up', 'left', 'right']

// How long to wait on each step before timing out (ms)
const STEP_TIMEOUT = 6000

// How long to hold a detected pose before accepting it (ms)
// Avoids accidental flickers being counted
const HOLD_DURATION = 600

// Interval between frame samples sent to Rekognition (ms)
const SAMPLE_INTERVAL = 700

export function useLiveness({ apiEndpoint = '/api/face-liveness-check' } = {}) {
  const [direction, setDirection] = useState(null)
  const [livenessState, setLivenessState] = useState('idle') // idle | running | passed | failed
  const [progress, setProgress] = useState(0)

  const stepIndexRef = useRef(0)
  const holdTimerRef = useRef(null)
  const stepTimerRef = useRef(null)
  const sampleIntervalRef = useRef(null)
  const cameraRef = useRef(null)
  const abortRef = useRef(false)

  const clearAllTimers = () => {
    clearTimeout(holdTimerRef.current)
    clearTimeout(stepTimerRef.current)
    clearInterval(sampleIntervalRef.current)
  }

  const startStepTimer = useCallback(() => {
    clearTimeout(stepTimerRef.current)
    stepTimerRef.current = setTimeout(() => {
      if (abortRef.current) return
      // Timed out on this step — liveness failed
      clearAllTimers()
      setDirection(null)
      setLivenessState('failed')
    }, STEP_TIMEOUT)
  }, [])

  const reset = useCallback(() => {
    abortRef.current = true
    clearAllTimers()
    setDirection(null)
    setLivenessState('idle')
    setProgress(0)
    stepIndexRef.current = 0
    // Re-arm for next start()
    setTimeout(() => { abortRef.current = false }, 50)
  }, [])

  const advanceStep = useCallback(() => {
    clearAllTimers()
    const nextIndex = stepIndexRef.current + 1
    setProgress(nextIndex)

    if (nextIndex >= SEQUENCE.length) {
      // All steps passed
      setDirection(null)
      setLivenessState('passed')
      return
    }

    stepIndexRef.current = nextIndex
    const nextDir = SEQUENCE[nextIndex]
    setDirection(nextDir)
    startStepTimer()
  }, [startStepTimer])

  /**
   * sampleFrame:
   * Captures a frame from the camera and sends it to the liveness-check
   * API route. The route calls DetectFaces and returns the estimated
   * head pose (Pitch, Roll, Yaw). We interpret that pose to decide
   * whether the user has moved in the required direction.
   */
  const sampleFrame = useCallback(async () => {
    if (abortRef.current || !cameraRef.current) return
    const camera = cameraRef.current

    const base64 = camera.capture?.()
    if (!base64) return

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      })

      if (!res.ok || abortRef.current) return

      const data = await res.json()
      // data.pose = { pitch, yaw, roll }
      const pose = data?.pose
      if (!pose) return

      const currentDir = SEQUENCE[stepIndexRef.current]
      const detected = isPoseMatchingDirection(pose, currentDir)

      if (detected) {
        // Start hold timer — must stay in pose for HOLD_DURATION
        if (!holdTimerRef.current) {
          holdTimerRef.current = setTimeout(() => {
            if (abortRef.current) return
            holdTimerRef.current = null
            advanceStep()
          }, HOLD_DURATION)
        }
      } else {
        // Pose dropped — cancel hold timer
        clearTimeout(holdTimerRef.current)
        holdTimerRef.current = null
      }
    } catch (_) {
      // Network or parse error — silently continue sampling
    }
  }, [apiEndpoint, advanceStep])

  const start = useCallback((camRef) => {
    abortRef.current = false
    cameraRef.current = camRef.current || camRef
    stepIndexRef.current = 0

    setProgress(0)
    setLivenessState('running')

    const firstDir = SEQUENCE[0]
    setDirection(firstDir)

    startStepTimer()

    sampleIntervalRef.current = setInterval(sampleFrame, SAMPLE_INTERVAL)
  }, [sampleFrame, startStepTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true
      clearAllTimers()
    }
  }, [])

  return {
    direction,
    livenessState,   // 'idle' | 'running' | 'passed' | 'failed'
    progress,        // 0, 1, 2, 3
    start,
    reset,
  }
}

/**
 * isPoseMatchingDirection
 *
 * AWS Rekognition DetectFaces returns head pose as:
 *   Pitch: positive = looking up, negative = looking down
 *   Yaw:   positive = looking right (from camera's view), negative = looking left
 *   Roll:  head tilt
 *
 * Thresholds chosen to be achievable but deliberate.
 */
function isPoseMatchingDirection(pose, direction) {
  const { pitch = 0, yaw = 0 } = pose

  switch (direction) {
    case 'up':
      return pitch > 12
    case 'left':
      // User's left = negative yaw from camera's perspective (mirrored feed)
      return yaw < -15
    case 'right':
      return yaw > 15
    default:
      return false
  }
}