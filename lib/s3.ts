import "server-only"
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { env, makeS3Client } from "@/lib/s3-client"

// Created lazily so `next build` (e.g. inside Docker) doesn't need S3 env vars
let internalClient: S3Client | undefined
let publicClient: S3Client | undefined

const internal = () => (internalClient ??= makeS3Client(env("S3_ENDPOINT")))
const signer = () =>
  (publicClient ??= makeS3Client(
    process.env.S3_PUBLIC_ENDPOINT ?? env("S3_ENDPOINT")
  ))

const bucket = () => env("S3_BUCKET_NAME")

/** Presigned URL the browser can PUT a file to. */
export function createUploadUrl(
  key: string,
  contentType: string,
  contentLength: number,
  expiresIn = 300
) {
  return getSignedUrl(
    signer(),
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    }),
    {
      expiresIn,
      signableHeaders: new Set(["content-type", "content-length", "host"]),
    }
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

export async function objectSize(key: string): Promise<number | null> {
  try {
    const head = await internal().send(
      new HeadObjectCommand({ Bucket: bucket(), Key: key })
    )
    return head.ContentLength ?? null
  } catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } })
      .$metadata?.httpStatusCode
    if (status === 404) return null
    throw error
  }
}

export async function deleteObject(key: string) {
  await internal().send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }))
}

/** Deletes every file stored for a user. Throws after finishing if any delete failed. */
export async function deleteUserFiles(userId: string) {
  // refuse anything that could widen the prefix beyond one user's folder
  if (!userId || userId.includes("/")) throw new Error("Invalid user id")
  const prefix = `users/${userId}/`

  let failed = 0
  let token: string | undefined
  do {
    const page = await internal().send(
      new ListObjectsV2Command({
        Bucket: bucket(),
        Prefix: prefix,
        ContinuationToken: token,
      })
    )
    const keys = (page.Contents ?? []).flatMap((o) => (o.Key ? [o.Key] : []))
    const results = await Promise.allSettled(
      keys.map((key) => deleteObject(key))
    )
    failed += results.filter((r) => r.status === "rejected").length
    token = page.NextContinuationToken
  } while (token)

  if (failed > 0) {
    throw new Error(`${failed} file(s) could not be deleted for user ${userId}`)
  }
}
