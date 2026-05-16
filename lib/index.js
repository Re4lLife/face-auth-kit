// ─── Public Components ────────────────────────────────────────────────────────
export { default as FaceRegister } from './components/FaceRegister'
export { default as FaceLogin }    from './components/FaceLogin'

// ─── API Route Handlers (consumer drops into their /api folder) ───────────────
// Liveness (recommended — anti-spoofing)
export { faceLivenessSessionHandler } from './handlers/faceLivenessSessionHandler'
export { faceLivenessResultHandler }  from './handlers/faceLivenessResultHandler'

// Photo fallback (no liveness check — for reference/testing only)
export { faceRegisterHandler } from './handlers/faceRegisterHandler'
export { faceLoginHandler }    from './handlers/faceLoginHandler'