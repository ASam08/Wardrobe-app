import {
  FULL_MAX_EDGE,
  THUMB_MAX_EDGE,
  MAX_FULL_BYTES,
  MAX_THUMB_BYTES,
  MAX_SOURCE_BYTES,
} from "@/lib/image-config"
import { requestImageUpload, confirmImageUpload } from "@/lib/actions"

export type PreparedImage = {
  contentType: "image/jpeg"
  full: Blob
  thumb: Blob
}

async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" })
  } catch {
    return await createImageBitmap(file)
  }
}

async function encode(bitmap: ImageBitmap, maxEdge: number, maxBytes: number) {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas is not available in this browser")

  ctx.fillStyle = "#fff"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingQuality = "high"
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  for (const quality of [0.85, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    )
    if (!blob || blob.type !== "image/jpeg") {
      throw new Error("This browser couldn't encode the image")
    }
    if (blob.size <= maxBytes) return blob
  }
  throw new Error("Image is too large even after compression")
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (file.size > MAX_SOURCE_BYTES) throw new Error("That file is too large")

  let bitmap: ImageBitmap
  try {
    bitmap = await decode(file)
  } catch {
    throw new Error("Couldn't read that image. Try a JPEG, PNG or WebP photo.")
  }
  try {
    const full = await encode(bitmap, FULL_MAX_EDGE, MAX_FULL_BYTES)
    const thumb = await encode(bitmap, THUMB_MAX_EDGE, MAX_THUMB_BYTES)
    return { contentType: "image/jpeg", full, thumb }
  } finally {
    bitmap.close()
  }
}

export async function uploadPreparedImage(
  itemId: string,
  prepared: PreparedImage
) {
  const { contentType, full, thumb } = prepared
  const input = {
    itemId,
    contentType,
    fullSize: full.size,
    thumbSize: thumb.size,
  }

  const { imageId, fullUrl, thumbUrl } = await requestImageUpload(input)

  const put = async (url: string, blob: Blob) => {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    })
    if (!res.ok) throw new Error(`Upload failed (${res.status})`)
  }
  await Promise.all([put(fullUrl, full), put(thumbUrl, thumb)])

  return confirmImageUpload({ ...input, imageId })
}
