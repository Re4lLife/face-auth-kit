import { CreateFaceLivenessSessionCommand } from '@aws-sdk/client-rekognition'
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts'
import { getClient } from '../lib/rekognitionClient'

/**
 * faceLivenessSessionHandler
 *
 * Drop into your Next.js API route:
 *
 *   // app/api/face-liveness-session/route.js
 *   import { faceLivenessSessionHandler } from 'face-auth-kit'
 *   export async function POST(req) {
 *     return faceLivenessSessionHandler(req)
 *   }
 *
 * Returns:
 *   200 { sessionId, credentials: { accessKeyId, secretAccessKey, sessionToken }, region }
 *   500 { code, message }
 *
 * Requires in .env:
 *   AWS_ACCESS_KEY_ID
 *   AWS_SECRET_ACCESS_KEY
 *   AWS_REGION
 *   AWS_LIVENESS_ROLE_ARN   ← IAM role with rekognition:StartFaceLivenessSession only
 */
async function faceLivenessSessionHandler(req) {
  try {
    const region = process.env.AWS_REGION || 'us-east-1'
    const roleArn = process.env.AWS_LIVENESS_ROLE_ARN

    if (!roleArn) {
      return jsonResponse(500, {
        code: 'MISSING_ROLE_ARN',
        message: 'AWS_LIVENESS_ROLE_ARN is not set. See face-auth-kit setup docs.',
      })
    }

    // 1. Create the liveness session (server-side, uses your master credentials)
    const rekognition = getClient()
    const sessionRes = await rekognition.send(
      new CreateFaceLivenessSessionCommand({
        Settings: {
          // FaceMovementChallenge = just look at camera, no coloured lights
          // FaceMovementAndLightChallenge = coloured light flashes (default, more secure)
          ChallengePreferences: [{ Type: 'FaceMovementAndLightChallenge' }],
        },
      })
    )

    const sessionId = sessionRes.SessionId

    // 2. Assume a minimal IAM role for the frontend
    //    This role has ONLY rekognition:StartFaceLivenessSession — nothing else.
    //    It is short-lived (900 seconds = 15 min) and scoped to this one operation.
    const sts = new STSClient({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      region,
    })

    const assumeRes = await sts.send(
      new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: `face-liveness-${sessionId}`,
        DurationSeconds: 900,
      })
    )

    const creds = assumeRes.Credentials

    return jsonResponse(200, {
      sessionId,
      region,
      credentials: {
        accessKeyId:     creds.AccessKeyId,
        secretAccessKey: creds.SecretAccessKey,
        sessionToken:    creds.SessionToken,
      },
    })
  } catch (err) {
    console.error('[face-auth-kit] faceLivenessSessionHandler error:', err)
    return jsonResponse(500, {
      code: 'SESSION_CREATE_ERROR',
      message: 'Failed to create liveness session. Please try again.',
    })
  }
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export { faceLivenessSessionHandler }