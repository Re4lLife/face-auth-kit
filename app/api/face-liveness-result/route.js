import { faceLivenessResultHandler } from '../../../lib/handlers/faceLivenessResultHandler'

export async function POST(req) {
  return faceLivenessResultHandler(req)
}