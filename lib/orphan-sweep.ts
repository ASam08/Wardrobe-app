import { DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { inArray, or } from "drizzle-orm"
import { sqlConn } from "./db"
import * as schema from "../db/schema"
import { env, makeS3Client } from "./s3-client"

function minutes(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback)
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

function describeKey(key: string) {
  const match =
    /^users\/([^/]+)\/items\/([^/]+)\/([^/]+?)(-thumb)?\.[a-z0-9]+$/.exec(key)
  if (!match) return null
  return {
    userId: match[1],
    imageId: match[3],
    kind: match[4] ? "thumbnail" : "full",
  }
}

export async function sweepOrphans({
  dryRun = process.env.ORPHAN_SWEEP_DRY_RUN === "true",
  signal,
}: { dryRun?: boolean; signal?: AbortSignal } = {}) {
  const imagesInDb = await sqlConn.$count(schema.itemImages)
  if (imagesInDb === 0) {
    console.warn(
      "[sweep] Image sweep skipped: no images found in the database. " +
        "If you expect images, check that DATABASE_URL points at the right database."
    )
    return
  }

  const client = makeS3Client(env("S3_ENDPOINT"))
  const Bucket = env("S3_BUCKET_NAME")
  const cutoff = Date.now() - minutes("ORPHAN_SWEEP_GRACE_MINUTES", 60) * 60_000

  const reviewed = new Set<string>()
  const deleted = new Set<string>()
  let token: string | undefined

  do {
    signal?.throwIfAborted()
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket,
        Prefix: "users/",
        ContinuationToken: token,
      }),
      { abortSignal: signal }
    )
    token = page.NextContinuationToken

    const old: string[] = []
    for (const object of page.Contents ?? []) {
      if (!object.Key) continue
      const info = describeKey(object.Key)
      reviewed.add(info ? `${info.userId}/${info.imageId}` : object.Key)
      if (object.LastModified && object.LastModified.getTime() < cutoff) {
        old.push(object.Key)
      }
    }
    if (old.length === 0) continue

    const known = await sqlConn
      .select({
        storageKey: schema.itemImages.storageKey,
        thumbKey: schema.itemImages.thumbKey,
      })
      .from(schema.itemImages)
      .where(
        or(
          inArray(schema.itemImages.storageKey, old),
          inArray(schema.itemImages.thumbKey, old)
        )
      )
    const knownKeys = new Set(
      known.flatMap((row) => [row.storageKey, row.thumbKey])
    )

    for (const key of old) {
      if (knownKeys.has(key)) continue
      signal?.throwIfAborted()

      const info = describeKey(key)
      const label = info
        ? `${info.kind} file, userId=${info.userId}, imageId=${info.imageId}`
        : `file ${key}`

      if (dryRun) {
        console.log(`[sweep] would delete ${label}`)
        continue
      }
      try {
        await client.send(new DeleteObjectCommand({ Bucket, Key: key }), {
          abortSignal: signal,
        })
        deleted.add(info ? `${info.userId}/${info.imageId}` : key)
        console.log(`[sweep] deleted ${label}`)
      } catch (error) {
        if (signal?.aborted) throw error
        console.error(`[sweep] failed to delete ${label}:`, error)
      }
    }
  } while (token)

  console.log(
    `[sweep] Image sweep completed, ${reviewed.size} images reviewed, ${deleted.size} images deleted` +
      (dryRun ? " (dry run, nothing was deleted)" : "")
  )
}

export function startOrphanSweeper() {
  const hours = Number(process.env.ORPHAN_SWEEP_INTERVAL_HOURS ?? 24)
  if (!Number.isFinite(hours) || hours <= 0) {
    console.log("[sweep] orphan sweeper disabled")
    return
  }

  const state = globalThis as { __orphanSweeperStarted?: boolean }
  if (state.__orphanSweeperStarted) return
  state.__orphanSweeperStarted = true

  const timeoutMinutes = minutes("ORPHAN_SWEEP_TIMEOUT_MINUTES", 60)
  let running = false

  const run = async () => {
    if (running) return
    running = true
    const signal = AbortSignal.timeout(timeoutMinutes * 60_000)
    try {
      await sweepOrphans({ signal })
    } catch (error) {
      if (signal.aborted) {
        console.warn(
          `[sweep] Image sweep stopped: still running after ${timeoutMinutes} minutes`
        )
      } else {
        console.error("[sweep] Image sweep failed:", error)
      }
    } finally {
      running = false
    }
  }

  void run()
  setInterval(run, hours * 60 * 60_000).unref()
}
