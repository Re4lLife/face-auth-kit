import { GetFaceLivenessSessionResultsCommand, SearchFacesByImageCommand } from '@aws-sdk/client-rekognition'
import { getClient, ensureCollection } from '../lib/rekognitionClient'

/**
 * faceLivenessResultHandler
 *
 * Drop into your Next.js API route:
 *
 *   // app/api/face-liveness-result/route.js
 *   import { faceLivenessResultHandler } from 'face-auth-kit'
 *   export async function POST(req) {
 *     return faceLivenessResultHandler(req)
 *   }
 *
 * Expects JSON body:
 *   { sessionId, collectionId?, mode: 'register'|'login' }
 *
 * Returns for REGISTER:
 *   200 { livenessConfidence, faceId, confidence, faceDetails }
 *       → consumer stores faceId against userId
 *
 * Returns for LOGIN:
 *   200 { livenessConfidence, faceId, similarity, confidence }
 *       → consumer checks similarity against their own threshold
 *
 * Returns error:
 *   400/500 { code, message }
 */
async function faceLivenessResultHandler(req) {
  let body

  try {
    body = await req.json()
  } catch {
    return jsonResponse(400, { code: 'INVALID_REQUEST', message: 'Request body must be JSON.' })
  }

  const { sessionId, collectionId, mode } = body

  if (!sessionId) return jsonResponse(400, { code: 'MISSING_SESSION_ID', message: 'No sessionId provided.' })
  if (!mode)      return jsonResponse(400, { code: 'MISSING_MODE',       message: 'mode must be "register" or "login".' })

  try {
    const client = getClient()

    // 1. Get liveness session results
    const livenessRes = await client.send(
      new GetFaceLivenessSessionResultsCommand({ SessionId: sessionId })
    )

    if (livenessRes.Status !== 'SUCCEEDED') {
      return jsonResponse(400, {
        code: 'LIVENESS_FAILED',
        message: 'Liveness check did not succeed. Please try again.',
      })
    }

    const livenessConfidence = livenessRes.Confidence

    // 2. Get the reference image bytes AWS captured during the session
    //    This is a high-quality frame extracted by AWS — better than a webcam snapshot
    const referenceImageBytes = livenessRes.ReferenceImage?.Bytes

    if (!referenceImageBytes) {
      return jsonResponse(400, {
        code: 'NO_REFERENCE_IMAGE',
        message: 'Could not extract face image from liveness session. Please try again.',
      })
    }

    // 3. REGISTER: index the face into the collection
    if (mode === 'register') {
      if (!collectionId) return jsonResponse(400, { code: 'MISSING_COLLECTION', message: 'No collectionId provided.' })

      await ensureCollection(collectionId)

      const { IndexFacesCommand } = await import('@aws-sdk/client-rekognition')
      const indexRes = await client.send(new IndexFacesCommand({
        CollectionId: collectionId,
        Image: { Bytes: referenceImageBytes },
        MaxFaces: 1,
        QualityFilter: 'MEDIUM',
        DetectionAttributes: ['ALL'],
      }))

      if (!indexRes.FaceRecords || indexRes.FaceRecords.length === 0) {
        return jsonResponse(400, {
          code: 'NO_FACE_DETECTED',
          message: 'No face detected in the liveness image. Please try again in better lighting.',
        })
      }

      const record = indexRes.FaceRecords[0]
      return jsonResponse(200, {
        livenessConfidence,
        faceId: record.Face.FaceId,
        confidence: record.Face.Confidence,
        faceDetails: {
          ageRange: record.FaceDetail?.AgeRange || null,
          quality:  record.FaceDetail?.Quality  || null,
        },
      })
    }

    // 4. LOGIN: search the reference image against the collection
    if (mode === 'login') {
      if (!collectionId) return jsonResponse(400, { code: 'MISSING_COLLECTION', message: 'No collectionId provided.' })

      await ensureCollection(collectionId)

      const searchRes = await client.send(new SearchFacesByImageCommand({
        CollectionId: collectionId,
        Image: { Bytes: referenceImageBytes },
        MaxFaces: 1,
        FaceMatchThreshold: 0,  // consumer decides threshold
        QualityFilter: 'MEDIUM',
      }))

      if (!searchRes.FaceMatches || searchRes.FaceMatches.length === 0) {
        return jsonResponse(400, {
          code: 'NO_MATCH',
          message: 'No matching face found.',
        })
      }

      const match = searchRes.FaceMatches[0]
      return jsonResponse(200, {
        livenessConfidence,
        faceId:     match.Face.FaceId,
        similarity: match.Similarity,
        confidence: match.Face.Confidence,
      })
    }

    return jsonResponse(400, { code: 'INVALID_MODE', message: 'mode must be "register" or "login".' })

  } catch (err) {
    console.error('[face-auth-kit] faceLivenessResultHandler error:', err)

    if (err.name === 'SessionNotFoundException') {
      return jsonResponse(400, {
        code: 'SESSION_EXPIRED',
        message: 'Liveness session expired or not found. Please try again.',
      })
    }
    if (err.name === 'InvalidParameterException') {
      return jsonResponse(400, {
        code: 'NO_FACE_DETECTED',
        message: 'No face detected. Please ensure your face is clearly visible.',
      })
    }

    return jsonResponse(500, {
      code: 'AWS_ERROR',
      message: 'An error occurred. Please try again.',
    })
  }
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export { faceLivenessResultHandler }