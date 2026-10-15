import "server-only"
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

function makeClient(endpoint: string) {
  return new S3Client({
    endpoint,
    region: env("S3_REGION"),
    forcePathStyle: true,
    credentials: {
      accessKeyId: env("S3_ACCESS_KEY"),
      secretAccessKey: env("S3_SECRET_KEY"),
    },
  })
}

// Created lazily so `next build` (e.g. inside Docker) doesn't need S3 env vars
let internalClient: S3Client | undefined
let publicClient: S3Client | undefined

const internal = () => (internalClient ??= makeClient(env("S3_ENDPOINT")))
const signer = () =>
  (publicClient ??= makeClient(
    process.env.S3_PUBLIC_ENDPOINT ?? env("S3_ENDPOINT")
  ))

const bucket = () => env("S3_BUCKET_NAME")

/** Presigned URL the browser can PUT a file to. */
export function createUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 300
) {
  return getSignedUrl(
    signer(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn }
  )
}

/** Presigned URL the browser can GET an image from. */
export function createDownloadUrl(key: string, expiresIn = 3600) {
  return getSignedUrl(
    signer(),
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
    { expiresIn }
  )
}

export async function objectExists(key: string) {
  try {
    await internal().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }))
    return true
  } catch {
    return false
  }
}

export async function deleteObject(key: string) {
  await internal().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))
}
