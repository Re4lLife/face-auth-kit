import { faceLivenessSessionHandler } from '../../../lib/handlers/faceLivenessSessionHandler'

export async function POST(req) {
  return faceLivenessSessionHandler(req)
}