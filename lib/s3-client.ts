import { S3Client } from "@aws-sdk/client-s3"

export function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing environment variable: ${name}`)
  return value
}

export function makeS3Client(endpoint: string) {
  return new S3Client({
    endpoint,
    region: env("S3_REGION"),
    forcePathStyle: true,
    // Newer SDK versions add a CRC32 checksum by default, which breaks presigned PUTs
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: env("S3_ACCESS_KEY"),
      secretAccessKey: env("S3_SECRET_KEY"),
    },
  })
}
