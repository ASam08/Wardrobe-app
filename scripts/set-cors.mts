import { applyBucketCors } from "@/lib/s3-cors"

console.log(
  "CORS rules now on bucket:",
  JSON.stringify(await applyBucketCors(), null, 2)
)
