# face-auth-kit

_A plug-and-play React package for authentication using facial detection and recognition._

[![npm version](https://img.shields.io/npm/v/face-auth-kit)](https://www.npmjs.com/package/face-auth-kit)
[![license](https://img.shields.io/npm/l/face-auth-kit)](https://github.com/Re4lLife/face-auth-kit)

Powered by **AWS Rekognition Face Liveness** - resistant to spoofing via printed photos, deepfakes, high-resolution images, and 3D masks.

---

## Core Dependencies

- [@aws-amplify/ui-react-liveness](https://www.npmjs.com/package/@aws-amplify/ui-react-liveness)
- [@aws-sdk/client-rekognition](https://www.npmjs.com/package/@aws-sdk/client-rekognition)
- [@aws-sdk/client-sts](https://www.npmjs.com/package/@aws-sdk/client-sts)

These are external dependencies of the package (not bundled into `dist`). Peer dependencies: `next`, `react`, `react-dom`.

---

## Installation

```bash
npm install face-auth-kit
npm install aws-amplify@6 @aws-amplify/ui-react@6 @aws-amplify/ui-react-liveness@3
```

The second command is required. The package's build leaves its dependencies external, so its output imports `aws-amplify` and the Amplify UI packages by name. They must be resolvable from your app's own `node_modules`; relying on hoisting from `face-auth-kit/node_modules` is unreliable.

> If npm reports an `ERESOLVE` peer-dependency conflict (it originates inside `@aws-amplify/ui-react-liveness`), append `--legacy-peer-deps` to the commands. It does not affect functionality.

### Configure Next.js

Add this to `next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: [
    'face-auth-kit',
    'aws-amplify',
    '@aws-amplify/ui-react',
    '@aws-amplify/ui-react-liveness',
  ],
}

export default nextConfig
```

`transpilePackages` makes Next.js compile these packages instead of treating them as pre-built. The Amplify packages ship ESM with sub-path exports (e.g. `aws-amplify/auth`, `@aws-amplify/core/internals/utils`) that the bundler may not resolve otherwise.

`reactStrictMode: false` is the configuration this package has been verified end-to-end with in development.

---

## How It Works

```
FaceRegister / FaceLogin
        │
        ▼
Your /api/face-liveness-session     → CreateFaceLivenessSession + STS AssumeRole
        │                              (returns sessionId + short-lived credentials)
        ▼
AWS Amplify FaceLivenessDetectorCore
        │                              (handles camera, oval, liveness challenge, WebSocket)
        ▼
Your /api/face-liveness-result      → GetFaceLivenessSessionResults
        │                              Register: IndexFaces → returns faceId
        │                              Login:    SearchFacesByImage → returns faceId + similarity
        ▼
onSuccess({ faceId, similarity, livenessConfidence, ... })
```

All AWS SDK complexity is hidden inside the package. You only deal with `onSuccess` and `onError` callbacks.

---

## AWS Setup

You need an **IAM user** for your server and an **IAM role** for the liveness WebSocket session. If you do not have an AWS account, [create one](https://signin.aws.amazon.com/signup?request_type=register).

### Option A — AWS CLI (recommended)

Prerequisite: the [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed and configured with an admin account (`aws configure`). Run the commands in order, in the same shell session.

**1. Get your account ID:**
```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
```

**2. Create the IAM user:**
```bash
aws iam create-user --user-name face-auth-kit
```

**3. Create the role (trusts only that user):**
```bash
aws iam create-role --role-name face-liveness-role --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":"arn:aws:iam::'"$ACCOUNT_ID"':user/face-auth-kit"},"Action":"sts:AssumeRole"}]}'
```

**4. Give the role permission to start a liveness session:**
```bash
aws iam put-role-policy --role-name face-liveness-role --policy-name face-liveness-role-policy --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"rekognition:StartFaceLivenessSession","Resource":"*"}]}'
```

**5. Give the user its permissions, including assuming the role:**
```bash
aws iam put-user-policy --user-name face-auth-kit --policy-name face-auth-kit-policy --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":["rekognition:CreateCollection","rekognition:IndexFaces","rekognition:SearchFacesByImage","rekognition:DeleteFaces","rekognition:DetectFaces","rekognition:CreateFaceLivenessSession","rekognition:GetFaceLivenessSessionResults"],"Resource":"*"},{"Effect":"Allow","Action":"sts:AssumeRole","Resource":"arn:aws:iam::'"$ACCOUNT_ID"':role/face-liveness-role"}]}'
```

**6. Create the access key:**
```bash
aws iam create-access-key --user-name face-auth-kit
```
Copy `AccessKeyId` → `AWS_ACCESS_KEY_ID` and `SecretAccessKey` → `AWS_SECRET_ACCESS_KEY`. The secret is shown only once.

**7. Print your role ARN:**
```bash
echo "arn:aws:iam::$ACCOUNT_ID:role/face-liveness-role"
```
Use it as `AWS_LIVENESS_ROLE_ARN`. IAM changes can take a few seconds to propagate before the first request works.

<details>
<summary><strong>Option B — AWS Console (step-by-step with screenshots)</strong></summary>

#### Part 1 — Create the IAM User (`face-auth-kit`)

1. Sign in to the [AWS IAM Console](https://console.aws.amazon.com/iam/).
2. In the left navigation pane, choose **Users**, then click **Create user**.

![Step 2a](https://raw.githubusercontent.com/Re4lLife/face-auth-kit/main/README/img1.png)
![Step 2b](https://raw.githubusercontent.com/Re4lLife/face-auth-kit/main/README/img2.png)

3. Enter the username **`face-auth-kit`** and click **Next**.

![Step 3](https://raw.githubusercontent.com/Re4lLife/face-auth-kit/main/README/img3.png)

4. Select **Attach policies directly**, then click **Create policy**.

![Step 4](https://raw.githubusercontent.com/Re4lLife/face-auth-kit/main/README/img4.png)

5. In the policy editor, choose the **JSON** tab and paste the following:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "rekognition:CreateCollection",
                "rekognition:IndexFaces",
                "rekognition:SearchFacesByImage",
                "rekognition:DeleteFaces",
                "rekognition:DetectFaces",
                "rekognition:CreateFaceLivenessSession",
                "rekognition:GetFaceLivenessSessionResults"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": "sts:AssumeRole",
            "Resource": "arn:aws:iam::YOUR_ACCOUNT_ID:role/face-liveness-role"
        }
    ]
}
```
> Replace `YOUR_ACCOUNT_ID` with your 12-digit AWS account ID (top-right of the AWS Console).

![Step 5](https://raw.githubusercontent.com/Re4lLife/face-auth-kit/main/README/img5.png)

Click **Next** at the bottom right.

6. Name the policy **`face-auth-kit-policy`** and click **Create policy**.
7. Back on the user creation screen, search for and attach **`face-auth-kit-policy`** (if it doesn't show up, reload the page, repeat step 3, select **Attach policies directly**, and search again), then click **Next** and **Create user**.

![Step 7](https://raw.githubusercontent.com/Re4lLife/face-auth-kit/main/README/img6.png)

8. Click the newly created user, open the **Security credentials** tab, scroll to **Access keys**, and click **Create access key**.

![Step 8](https://raw.githubusercontent.com/Re4lLife/face-auth-kit/main/README/img7.png)

9. Select **Application running outside AWS**, click **Next**, then **Create access key**.

![Step 9](https://raw.githubusercontent.com/Re4lLife/face-auth-kit/main/README/img8.png)

10. **Copy and save** the `Access key ID` and `Secret access key` (or download the .csv). Click **Done**. You will not be able to see the secret again.

#### Part 2 — Create the IAM Role (`face-liveness-role`)

This role is assumed temporarily by your server to give the browser just enough permission to start the liveness WebSocket session, and nothing more.

1. In the IAM Console, choose **Roles**, then **Create role**.

![Role 1](https://raw.githubusercontent.com/Re4lLife/face-auth-kit/main/README/img9.png)

2. Under **Trusted entity type**, select **Custom trust policy**.

![Role 2](https://raw.githubusercontent.com/Re4lLife/face-auth-kit/main/README/img10.png)

3. Paste the following trust policy, replacing `YOUR_ACCOUNT_ID`:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:user/face-auth-kit"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```

![Role 3](https://raw.githubusercontent.com/Re4lLife/face-auth-kit/main/README/img11.png)

Click **Next**.

4. On the **Add permissions** page, [create a role policy](https://us-east-1.console.aws.amazon.com/iam/home?region=us-east-1#/policies) (opens a new tab) and click **Create policy**.

![Role 4](https://raw.githubusercontent.com/Re4lLife/face-auth-kit/main/README/img12.png)

5. Choose the **JSON** tab and paste:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "rekognition:StartFaceLivenessSession",
            "Resource": "*"
        }
    ]
}
```

![Role 5](https://raw.githubusercontent.com/Re4lLife/face-auth-kit/main/README/img13.png)

Click **Next**.

6. Name this policy **`face-liveness-role-policy`** and click **Create policy**.
7. Back on the role creation tab, refresh the policy list, select **`face-liveness-role-policy`**, and click **Next**.
8. Name the role **`face-liveness-role`** and click **Create role**.
9. Open the new role and copy its **ARN**. It looks like `arn:aws:iam::YOUR_ACCOUNT_ID:role/face-liveness-role`.

![Role 9](https://raw.githubusercontent.com/Re4lLife/face-auth-kit/main/README/img14.png)

</details>

### Environment Variables

Add to your `.env.local`:

```dotenv
AWS_ACCESS_KEY_ID="your_access_key_id"
AWS_SECRET_ACCESS_KEY="your_secret_access_key"
AWS_REGION=us-east-1
AWS_LIVENESS_ROLE_ARN="arn:aws:iam::YOUR_ACCOUNT_ID:role/face-liveness-role"
```

Choose a region where Face Liveness is available and that is close to your users: the browser opens a WebSocket to `streaming-rekognition.<AWS_REGION>.amazonaws.com`, and slow connections can time out (see Troubleshooting).

---

## Usage

### 1. Create the API Routes

These are **your** routes. Import the handlers from **`face-auth-kit/server`** (not from `face-auth-kit`).

**`app/api/face-liveness-session/route.js`**
```js
import { faceLivenessSessionHandler } from 'face-auth-kit/server'

export async function POST(req) {
  return faceLivenessSessionHandler(req)
}
```

**`app/api/face-liveness-result/route.js`**
```js
import { faceLivenessResultHandler } from 'face-auth-kit/server'

export async function POST(req) {
  return faceLivenessResultHandler(req)
}
```

---

### 2. Register a Face

```jsx
'use client'

import { FaceRegister } from 'face-auth-kit'

export default function RegisterPage() {
  return (
    <FaceRegister
      collectionId="my-app-users"
      onSuccess={({ faceId, livenessConfidence, confidence, faceDetails }) => {
        // Save faceId to your database against the user
        console.log('Store this faceId:', faceId)
      }}
      onError={({ code, message }) => {
        console.error(code, message)
      }}
      theme="dark"
    />
  )
}
```

**`onSuccess` payload:**
```json
{
  "livenessConfidence": 77.30628967285156,
  "faceId": "e534ec94-ab1e-430b-8cee-c72c7934f203",
  "confidence": 99.99966430664062,
  "faceDetails": {
    "ageRange": { "Low": 22, "High": 28 },
    "quality": {
      "Brightness": 94.83789825439453,
      "Sharpness": 92.22801208496094
    }
  }
}
```

> Store `faceId` in your database linked to the user. This is what you'll look up on login.

---

### 3. Login with Face

```jsx
'use client'

import { FaceLogin } from 'face-auth-kit'

export default function LoginPage() {
  return (
    <FaceLogin
      collectionId="my-app-users"
      onSuccess={({ faceId, similarity, livenessConfidence, confidence }) => {
        // You decide the threshold — the library returns the raw score
        if (similarity >= 90) {
          grantAccess(faceId) // look up faceId in your DB to identify the user
        } else {
          alert('Face not close enough match')
        }
      }}
      onError={({ code, message }) => {
        console.error(code, message)
      }}
      theme="dark"
    />
  )
}
```

**`onSuccess` payload:**
```json
{
  "livenessConfidence": 79.06428527832031,
  "faceId": "76f3fce9-ceef-4e1c-aa6b-61e0102fd0c0",
  "similarity": 99.9786148071289,
  "confidence": 99.9999008178711
}
```

> `similarity` is a score from 0–100. You choose your own threshold; 90 is a reasonable default.
> `livenessConfidence` tells you how confident AWS is that the person is physically present (not a photo, deepfake, or mask).

---

### 4. Optional: self-host the face-detection files

By default the browser downloads the face-detection model and TensorFlow WASM files from `cdn.liveness.rekognition.amazonaws.com`, with a 10-second limit built into Amplify. On slow or restricted networks this fails with `Face detection model loading timed out`. Serving the files from your own app avoids it.

**1. Copy the WASM files (from your `node_modules`):**
```bash
mkdir -p public/liveness/wasm public/liveness/model && cp node_modules/@tensorflow/tfjs-backend-wasm/dist/*.wasm public/liveness/wasm/
```

**2. Download the model once:**
```bash
cd public/liveness/model && B=https://cdn.liveness.rekognition.amazonaws.com/face-detection/tensorflow-models/blazeface/1.0.2/model && curl --retry 5 -C - -O $B/model.json && for f in $(grep -oE '[A-Za-z0-9_.-]+\.bin' model.json | sort -u); do curl --retry 5 -C - -O $B/$f; done; ls -la; cd ../../..
```
`ls` should show `model.json` and one or more `.bin` files with non-zero sizes.

**3. Point the components at them:**
```jsx
<FaceRegister
  collectionId="my-app-users"
  faceModelUrl="/liveness/model/model.json"
  binaryPath="/liveness/wasm/"
  onSuccess={...}
  onError={...}
/>
```
Use the same two props on `<FaceLogin />`.

---

## Props

### `<FaceRegister />`

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `collectionId` | `string` | ✅ | — | Your AWS Rekognition collection ID. Created automatically on first use. |
| `onSuccess` | `function` | ✅ | — | Called with `{ faceId, livenessConfidence, confidence, faceDetails }` |
| `onError` | `function` | ✅ | — | Called with `{ code, message }` |
| `sessionApiEndpoint` | `string` | ❌ | `/api/face-liveness-session` | The route that creates the liveness session. **You must create this route** (see Usage step 1). |
| `resultApiEndpoint` | `string` | ❌ | `/api/face-liveness-result` | The route that fetches liveness results. **You must create this route** (see Usage step 1). |
| `faceModelUrl` | `string` | ❌ | Amplify's CDN | URL of a self-hosted `model.json` (see Usage step 4). |
| `binaryPath` | `string` | ❌ | Amplify's CDN | Path prefix of self-hosted TensorFlow `.wasm` files, e.g. `/liveness/wasm/` (see Usage step 4). |
| `theme` | `"dark" \| "light"` | ❌ | `"dark"` | Component colour theme |
| `className` | `string` | ❌ | `""` | CSS class for the wrapper div |

### `<FaceLogin />`

| Prop | Type | Required | Default | Description |
|---|---|---|---|---|
| `collectionId` | `string` | ✅ | — | Must match the `collectionId` used during registration |
| `onSuccess` | `function` | ✅ | — | Called with `{ faceId, similarity, livenessConfidence, confidence }` |
| `onError` | `function` | ✅ | — | Called with `{ code, message }` |
| `sessionApiEndpoint` | `string` | ❌ | `/api/face-liveness-session` | The route that creates the liveness session. **You must create this route** (see Usage step 1). |
| `resultApiEndpoint` | `string` | ❌ | `/api/face-liveness-result` | The route that fetches liveness results. **You must create this route** (see Usage step 1). |
| `faceModelUrl` | `string` | ❌ | Amplify's CDN | URL of a self-hosted `model.json` (see Usage step 4). |
| `binaryPath` | `string` | ❌ | Amplify's CDN | Path prefix of self-hosted TensorFlow `.wasm` files (see Usage step 4). |
| `theme` | `"dark" \| "light"` | ❌ | `"dark"` | Component colour theme |
| `className` | `string` | ❌ | `""` | CSS class for the wrapper div |

---

## Error Codes

Both `onError` callbacks receive an object with a `code` and a human-readable `message`.

| Code | Meaning |
|---|---|
| `SESSION_CREATE_ERROR` | Could not start a liveness session. Check your AWS credentials and network |
| `LIVENESS_FAILED` | The liveness challenge was not completed successfully |
| `SESSION_EXPIRED` | The session timed out (sessions are single-use and expire after 3 minutes). Also returned when the WebSocket connection to Rekognition times out or Rekognition rejects the stream, so check Troubleshooting if it appears immediately |
| `NO_FACE_DETECTED` | No face was found in the captured image |
| `NO_REFERENCE_IMAGE` | AWS could not extract a reference image from the liveness session |
| `NO_MATCH` | No matching face found in the collection *(login only)* |
| `MISSING_ROLE_ARN` | `AWS_LIVENESS_ROLE_ARN` is not set in your environment variables |
| `AWS_ERROR` | An unexpected AWS error occurred |

---

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `createContext is not a function` in an API route | The route imports from `face-auth-kit`. Import the handlers from `face-auth-kit/server`. |
| `not authorized to perform: sts:AssumeRole` | The user policy or role trust policy is missing or points at the wrong account. Re-run Option A steps 3 and 5 (for an existing role use `aws iam update-assume-role-policy --role-name face-liveness-role --policy-document '<trust policy from step 3>'`). |
| `not authorized to perform: rekognition:StartFaceLivenessSession` (shown as `SESSION_EXPIRED`) | The role has no permission policy. Re-run Option A step 4. |
| `Websocket connection timeout` or `Face detection model loading timed out` | The browser could not reach AWS within Amplify's built-in 10-second limit. Try a nearer supported region or a different network, and self-host the model files (Usage step 4). |
| Session route takes tens of seconds | Slow route from your server to AWS. Use a nearer region. |

---

## Important Notes

**Duplicate registration:** AWS Rekognition does not detect duplicate face registrations on `IndexFaces`. If the same person registers twice, two separate `faceId` values will be stored and you will be charged for both. To prevent this, run a login check before registering and reject the registration if a match is found above your threshold.

**AWS billing:** You are charged per image processed by Rekognition and per face stored in a collection. Stored faces cost approximately $0.00001 per face per month. See [AWS Rekognition pricing](https://aws.amazon.com/rekognition/pricing/).

**Liveness sessions are single-use:** Each session ID can only be used once. If a user fails or the component unmounts, a new session is started automatically.

**AWS region:** AWS Face Liveness is not available in all regions. Check [AWS regional services](https://aws.amazon.com/about-aws/global-infrastructure/regional-product-services/).

**Security:** Your AWS credentials are never exposed to the browser. `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` live only in your server environment. The browser only receives short-lived temporary credentials scoped to a single liveness session. Never commit `.env` files.

---

## License

MIT