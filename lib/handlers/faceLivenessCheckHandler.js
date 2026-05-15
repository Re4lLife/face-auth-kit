import { DetectFacesCommand } from '@aws-sdk/client-rekognition'
import { getClient, base64ToBytes } from '../lib/rekognitionClient'


async function faceLivenessCheckHandler(req) {
  let body

  try {
    body = await req.json()
  } catch {
    return jsonResponse(400, { code: 'INVALID_REQUEST', message: 'Request body must be JSON.' })
  }

  const { image } = body

  if (!image) {
    return jsonResponse(400, { code: 'MISSING_IMAGE', message: 'No image provided.' })
  }

  try {
    const client = getClient()
    const imageBytes = base64ToBytes(image)

    const command = new DetectFacesCommand({
      Image: { Bytes: imageBytes },
      Attributes: ['DEFAULT'],  // DEFAULT includes Pose, Quality, BoundingBox
    })

    const response = await client.send(command)

    if (!response.FaceDetails || response.FaceDetails.length === 0) {
      return jsonResponse(200, { pose: null, confidence: null })
    }

    const face = response.FaceDetails[0]
    const pose = face.Pose

    return jsonResponse(200, {
      pose: {
        pitch: pose?.Pitch ?? 0,
        yaw:   pose?.Yaw ?? 0,
        roll:  pose?.Roll ?? 0,
      },
      confidence: face.Confidence,
    })
  } catch (err) {
    console.error('[face-auth-kit] faceLivenessCheckHandler error:', err)
    // Return null pose rather than crashing the challenge
    return jsonResponse(200, { pose: null, confidence: null })
  }
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export { faceLivenessCheckHandler }