import { PutBucketCorsCommand, GetBucketCorsCommand } from "@aws-sdk/client-s3"
import { env, makeS3Client } from "./s3-client"

function origins() {
  return (process.env.S3_CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
}

/** Sets the bucket's CORS rule (replaces any existing rules) and returns what Garage stored. */
export async function applyBucketCors() {
  const client = makeS3Client(env("S3_ENDPOINT"))
  const Bucket = env("S3_BUCKET_NAME")

  await client.send(
    new PutBucketCorsCommand({
      Bucket,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedOrigins: origins(),
            AllowedMethods: ["PUT", "GET", "HEAD"],
            AllowedHeaders: ["content-type"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    })
  )

  const { CORSRules } = await client.send(new GetBucketCorsCommand({ Bucket }))
  return CORSRules
}

/** Boot-time version: retries while Garage comes up, then logs instead of crashing the app. */
export async function applyBucketCorsOnBoot(attempts = 30, delayMs = 5000) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const rules = await applyBucketCors()
      console.log(
        "[s3] bucket CORS applied. Stored rules:",
        JSON.stringify(rules)
      )
      return
    } catch (error) {
      console.warn(`[s3] CORS attempt ${attempt}/${attempts} failed:`, error)
      if (attempt === attempts) {
        console.error(
          "[s3] giving up; browser uploads will fail until CORS is applied"
        )
        return
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}
