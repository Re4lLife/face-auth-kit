
import { faceLoginHandler } from '../../../lib/handlers/faceLoginHandler';
  
export async function POST(req) {
  return faceLoginHandler(req)
}
 
//   Expects JSON body: { image: string (base64), collectionId: string }
 
//   Returns:
//     200 { faceId, similarity, confidence }
//     400 { code, message }
//     500 { code, message }
 
//   NOTE: The similarity score (0–100) is returned as-is.
//   The consumer decides their own threshold:
//     if (result.similarity >= 90) grantAccess()
 