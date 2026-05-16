import { faceRegisterHandler } from '../../../lib/handlers/faceRegisterHandler'

export async function POST(req) {
  return faceRegisterHandler(req)
}