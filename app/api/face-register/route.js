
import { faceRegisterHandler } from '../../../lib/handlers/faceRegisterHandler';

export async function POST(req) {
    return faceRegisterHandler(req)
}

// Expects JSON { image: string(base64), collectionId: string }
//
// Returns:
// 200 { faceId, confidence, faceDetails: { ageRange, quality } }
// 400 { code, message }
// 500 { code, message }