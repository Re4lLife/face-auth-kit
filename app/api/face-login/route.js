import { faceLoginHandler } from '../../../lib/handlers/faceLoginHandler'

export async function POST(req) {
  return faceLoginHandler(req)
}