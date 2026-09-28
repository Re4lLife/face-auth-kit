// lib/handlers/faceLivenessSessionHandler.js
import { CreateFaceLivenessSessionCommand } from "@aws-sdk/client-rekognition";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

// lib/lib/rekognitionClient.js
import { RekognitionClient, CreateCollectionCommand } from "@aws-sdk/client-rekognition";
function getClient() {
  return new RekognitionClient({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    region: process.env.AWS_REGION || "us-east-1"
  });
}
async function ensureCollection(collectionId) {
  const client = getClient();
  try {
    await client.send(new CreateCollectionCommand({ CollectionId: collectionId }));
  } catch (err) {
    if (err.name === "ResourceAlreadyExistsException") return;
    throw err;
  }
}

// lib/handlers/faceLivenessSessionHandler.js
async function faceLivenessSessionHandler(req) {
  try {
    const region = process.env.AWS_REGION || "us-east-1";
    const roleArn = process.env.AWS_LIVENESS_ROLE_ARN;
    if (!roleArn) {
      return jsonResponse(500, {
        code: "MISSING_ROLE_ARN",
        message: "AWS_LIVENESS_ROLE_ARN is not set. See face-auth-kit setup docs."
      });
    }
    const rekognition = getClient();
    const sessionRes = await rekognition.send(
      new CreateFaceLivenessSessionCommand({
        Settings: {
          // FaceMovementChallenge = just look at camera, no coloured lights
          // FaceMovementAndLightChallenge = coloured light flashes (default, more secure)
          ChallengePreferences: [{ Type: "FaceMovementAndLightChallenge" }]
        }
      })
    );
    const sessionId = sessionRes.SessionId;
    const sts = new STSClient({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },
      region
    });
    const assumeRes = await sts.send(
      new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: `face-liveness-${sessionId}`,
        DurationSeconds: 900
      })
    );
    const creds = assumeRes.Credentials;
    return jsonResponse(200, {
      sessionId,
      region,
      credentials: {
        accessKeyId: creds.AccessKeyId,
        secretAccessKey: creds.SecretAccessKey,
        sessionToken: creds.SessionToken
      }
    });
  } catch (err) {
    console.error("[face-auth-kit] faceLivenessSessionHandler error:", err);
    return jsonResponse(500, {
      code: "SESSION_CREATE_ERROR",
      message: "Failed to create liveness session. Please try again."
    });
  }
}
function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// lib/handlers/faceLivenessResultHandler.js
import { GetFaceLivenessSessionResultsCommand, SearchFacesByImageCommand } from "@aws-sdk/client-rekognition";
async function faceLivenessResultHandler(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse2(400, { code: "INVALID_REQUEST", message: "Request body must be JSON." });
  }
  const { sessionId, collectionId, mode } = body;
  if (!sessionId) return jsonResponse2(400, { code: "MISSING_SESSION_ID", message: "No sessionId provided." });
  if (!mode) return jsonResponse2(400, { code: "MISSING_MODE", message: 'mode must be "register" or "login".' });
  try {
    const client = getClient();
    const livenessRes = await client.send(
      new GetFaceLivenessSessionResultsCommand({ SessionId: sessionId })
    );
    if (livenessRes.Status !== "SUCCEEDED") {
      return jsonResponse2(400, {
        code: "LIVENESS_FAILED",
        message: "Liveness check did not succeed. Please try again."
      });
    }
    const livenessConfidence = livenessRes.Confidence;
    const referenceImageBytes = livenessRes.ReferenceImage?.Bytes;
    if (!referenceImageBytes) {
      return jsonResponse2(400, {
        code: "NO_REFERENCE_IMAGE",
        message: "Could not extract face image from liveness session. Please try again."
      });
    }
    if (mode === "register") {
      if (!collectionId) return jsonResponse2(400, { code: "MISSING_COLLECTION", message: "No collectionId provided." });
      await ensureCollection(collectionId);
      const { IndexFacesCommand } = await import("@aws-sdk/client-rekognition");
      const indexRes = await client.send(new IndexFacesCommand({
        CollectionId: collectionId,
        Image: { Bytes: referenceImageBytes },
        MaxFaces: 1,
        QualityFilter: "MEDIUM",
        DetectionAttributes: ["ALL"]
      }));
      if (!indexRes.FaceRecords || indexRes.FaceRecords.length === 0) {
        return jsonResponse2(400, {
          code: "NO_FACE_DETECTED",
          message: "No face detected in the liveness image. Please try again in better lighting."
        });
      }
      const record = indexRes.FaceRecords[0];
      return jsonResponse2(200, {
        livenessConfidence,
        faceId: record.Face.FaceId,
        confidence: record.Face.Confidence,
        faceDetails: {
          ageRange: record.FaceDetail?.AgeRange || null,
          quality: record.FaceDetail?.Quality || null
        }
      });
    }
    if (mode === "login") {
      if (!collectionId) return jsonResponse2(400, { code: "MISSING_COLLECTION", message: "No collectionId provided." });
      await ensureCollection(collectionId);
      const searchRes = await client.send(new SearchFacesByImageCommand({
        CollectionId: collectionId,
        Image: { Bytes: referenceImageBytes },
        MaxFaces: 1,
        FaceMatchThreshold: 0,
        // consumer decides threshold
        QualityFilter: "MEDIUM"
      }));
      if (!searchRes.FaceMatches || searchRes.FaceMatches.length === 0) {
        return jsonResponse2(400, {
          code: "NO_MATCH",
          message: "No matching face found."
        });
      }
      const match = searchRes.FaceMatches[0];
      return jsonResponse2(200, {
        livenessConfidence,
        faceId: match.Face.FaceId,
        similarity: match.Similarity,
        confidence: match.Face.Confidence
      });
    }
    return jsonResponse2(400, { code: "INVALID_MODE", message: 'mode must be "register" or "login".' });
  } catch (err) {
    console.error("[face-auth-kit] faceLivenessResultHandler error:", err);
    if (err.name === "SessionNotFoundException") {
      return jsonResponse2(400, {
        code: "SESSION_EXPIRED",
        message: "Liveness session expired or not found. Please try again."
      });
    }
    if (err.name === "InvalidParameterException") {
      return jsonResponse2(400, {
        code: "NO_FACE_DETECTED",
        message: "No face detected. Please ensure your face is clearly visible."
      });
    }
    return jsonResponse2(500, {
      code: "AWS_ERROR",
      message: "An error occurred. Please try again."
    });
  }
}
function jsonResponse2(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
export {
  faceLivenessResultHandler,
  faceLivenessSessionHandler
};
//# sourceMappingURL=server.mjs.map