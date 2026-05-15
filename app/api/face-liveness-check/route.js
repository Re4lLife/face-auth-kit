
import { faceLivenessCheckHandler } from '../../../lib/handlers/faceLivenessCheckHandler'

export async function POST(req) {
    return faceLivenessCheckHandler(req)
}
 
//   Expects JSON body: { image: string(base64) }

// Returns:
// 200 { pose: { pitch, yaw, roll }, confidence }
// 400 { code, message }
