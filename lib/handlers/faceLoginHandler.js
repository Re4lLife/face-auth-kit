import { SearchFacesByImageCommand } from '@aws-sdk/client-rekognition'
import { getClient, ensureCollection, base64ToBytes } from '../lib/rekognitionClient'


async function faceLoginHandler(req) {
  let body

  try {
    body = await req.json()
  } catch {
    return jsonResponse(400, { code: 'INVALID_REQUEST', message: 'Request body must be JSON.' })
  }

  const { image, collectionId } = body

  if (!image) {
    return jsonResponse(400, { code: 'MISSING_IMAGE', message: 'No image provided.' })
  }
  if (!collectionId) {
    return jsonResponse(400, { code: 'MISSING_COLLECTION', message: 'No collectionId provided.' })
  }

  try {
    const client = getClient()

    // Ensure collection exists — safe to call even if it already does
    await ensureCollection(collectionId)

    const imageBytes = base64ToBytes(image)

    const command = new SearchFacesByImageCommand({
      CollectionId: collectionId,
      Image: { Bytes: imageBytes },
      MaxFaces: 1,
      // We don't apply FaceMatchThreshold here — consumer controls their threshold
      FaceMatchThreshold: 0,
      QualityFilter: 'MEDIUM',
    })

    const response = await client.send(command)

    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      return jsonResponse(400, {
        code: 'NO_MATCH',
        message: 'No matching face found.',
      })
    }

    const match = response.FaceMatches[0]

    return jsonResponse(200, {
      faceId: match.Face.FaceId,
      similarity: match.Similarity,          // consumer compares against their threshold
      confidence: match.Face.Confidence,
    })
  } catch (err) {
    console.error('[face-auth-kit] faceLoginHandler error:', err)

    if (err.name === 'InvalidParameterException') {
      return jsonResponse(400, {
        code: 'NO_FACE_DETECTED',
        message: 'No face detected in the image. Please position your face clearly and try again.',
      })
    }

    if (err.name === 'ResourceNotFoundException') {
      return jsonResponse(400, {
        code: 'COLLECTION_NOT_FOUND',
        message: 'Face collection not found. Please register first.',
      })
    }

    return jsonResponse(500, {
      code: 'AWS_ERROR',
      message: 'An error occurred during face login. Please try again.',
    })
  }
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export { faceLoginHandler }