export const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const

export type ImageType = keyof typeof IMAGE_TYPES
export const IMAGE_TYPE_LIST = Object.keys(IMAGE_TYPES) as [
  ImageType,
  ...ImageType[],
]

export const MAX_FULL_BYTES = 5 * 1024 * 1024
export const MAX_THUMB_BYTES = 500 * 1024

export const MAX_IMAGES_PER_ITEM = 1
