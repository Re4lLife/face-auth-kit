import { IndexFacesCommand } from '@aws-sdk/client-rekognition'
import { getClient, ensureCollection, base64ToBytes } from '../lib/rekognitionClient'


async function faceRegisterHandler(req) {
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

    // Auto-create collection if it doesn't exist
    await ensureCollection(collectionId)

    const imageBytes = base64ToBytes(image)

    const command = new IndexFacesCommand({
      CollectionId: collectionId,
      Image: { Bytes: imageBytes },
      MaxFaces: 1,
      QualityFilter: 'MEDIUM',
      DetectionAttributes: ['ALL'],
    })

    const response = await client.send(command)

    if (!response.FaceRecords || response.FaceRecords.length === 0) {
      return jsonResponse(400, {
        code: 'NO_FACE_DETECTED',
        message: 'No face detected in the image. Please ensure your face is clearly visible.',
      })
    }

    if (response.UnindexedFaces && response.UnindexedFaces.length > 0) {
      const reason = response.UnindexedFaces[0]?.Reasons?.[0]
      if (reason === 'EXCEEDS_MAX_FACES') {
        return jsonResponse(400, {
          code: 'MULTIPLE_FACES',
          message: 'Multiple faces detected. Please ensure only your face is in the frame.',
        })
      }
      if (reason === 'LOW_QUALITY') {
        return jsonResponse(400, {
          code: 'LOW_QUALITY',
          message: 'Image quality too low. Ensure good lighting and try again.',
        })
      }
    }

    const record = response.FaceRecords[0]
    const face = record.Face
    const detail = record.FaceDetail

    return jsonResponse(200, {
      faceId: face.FaceId,
      confidence: face.Confidence,
      faceDetails: {
        ageRange: detail?.AgeRange || null,
        quality: detail?.Quality || null,
      },
    })
  } catch (err) {
    console.error('[face-auth-kit] faceRegisterHandler error:', err)

    if (err.name === 'InvalidParameterException') {
      return jsonResponse(400, {
        code: 'INVALID_IMAGE',
        message: 'The image could not be processed. Please try again with better lighting.',
      })
    }

    return jsonResponse(500, {
      code: 'AWS_ERROR',
      message: 'An error occurred during face registration. Please try again.',
    })
  }
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export { faceRegisterHandler }