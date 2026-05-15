import { RekognitionClient, CreateCollectionCommand } from '@aws-sdk/client-rekognition'

/**
 * Returns a configured RekognitionClient.
 * Reads credentials from process.env — never from the component bundle.
 */
function getClient() {
  return new RekognitionClient({
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_REGION || 'us-east-1',
  })
}

/**
 * Ensures a Rekognition collection exists.
 * Creates it if it doesn't — silently skips if it already does.
 * Called automatically at the start of every register/login handler.
 */
async function ensureCollection(collectionId) {
  const client = getClient()
  try {
    await client.send(new CreateCollectionCommand({ CollectionId: collectionId }))
  } catch (err) {
    if (err.name === 'ResourceAlreadyExistsException') return
    throw err
  }
}

/**
 * Converts a base64 data URL (from the webcam) to a Uint8Array
 * that Rekognition's Image.Bytes expects.
 */
function base64ToBytes(base64String) {
  // Strip the data:image/jpeg;base64, prefix if present
  const base64 = base64String.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64, 'base64')
}

export { getClient, ensureCollection, base64ToBytes }