"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/server.js
var server_exports = {};
__export(server_exports, {
  faceLivenessResultHandler: () => faceLivenessResultHandler,
  faceLivenessSessionHandler: () => faceLivenessSessionHandler
});
module.exports = __toCommonJS(server_exports);

// lib/handlers/faceLivenessSessionHandler.js
var import_client_rekognition2 = require("@aws-sdk/client-rekognition");
var import_client_sts = require("@aws-sdk/client-sts");

// lib/lib/rekognitionClient.js
var import_client_rekognition = require("@aws-sdk/client-rekognition");
function getClient() {
  return new import_client_rekognition.RekognitionClient({
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
    await client.send(new import_client_rekognition.CreateCollectionCommand({ CollectionId: collectionId }));
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
      new import_client_rekognition2.CreateFaceLivenessSessionCommand({
        Settings: {
          // FaceMovementChallenge = just look at camera, no coloured lights
          // FaceMovementAndLightChallenge = coloured light flashes (default, more secure)
          ChallengePreferences: [{ Type: "FaceMovementAndLightChallenge" }]
        }
      })
    );
    const sessionId = sessionRes.SessionId;
    const sts = new import_client_sts.STSClient({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      },
      region
    });
    const assumeRes = await sts.send(
      new import_client_sts.AssumeRoleCommand({
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
var import_client_rekognition3 = require("@aws-sdk/client-rekognition");
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
      new import_client_rekognition3.GetFaceLivenessSessionResultsCommand({ SessionId: sessionId })
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
      const searchRes = await client.send(new import_client_rekognition3.SearchFacesByImageCommand({
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  faceLivenessResultHandler,
  faceLivenessSessionHandler
});
//# sourceMappingURL=server.js.map