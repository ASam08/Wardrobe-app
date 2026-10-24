"use server"

import { sqlConn } from "@/lib/db"
import * as schema from "@/db/schema"
import { eq, or, isNull, and, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Season } from "@/lib/definitions"
import {
  itemFormSchema,
  type ItemFormValues,
  imageRequestSchema,
  type ImageRequestValues,
  imageConfirmSchema,
  type ImageConfirmValues,
} from "@/lib/schema"
import { createUploadUrl, objectSize, deleteObject } from "@/lib/s3"
import {
  IMAGE_TYPES,
  MAX_IMAGES_PER_ITEM,
  type ImageType,
} from "@/lib/image-config"

function isSeason(value: string): value is Season {
  return (schema.seasonEnum.enumValues as readonly string[]).includes(value)
}

export async function retrieveUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("User is not authenticated")
  return session.user.id
}

export async function createCategory(name: string) {
  const userId = await retrieveUserId()

  const trimmed = name.trim()
  if (!trimmed) throw new Error("Category name is required")

  const findExisting = async () => {
    const [row] = await sqlConn
      .select({ id: schema.categories.id, name: schema.categories.name })
      .from(schema.categories)
      .where(
        and(
          or(
            eq(schema.categories.userId, userId),
            isNull(schema.categories.userId)
          ),
          sql`lower(${schema.categories.name}) = lower(${trimmed})`
        )
      )
      .limit(1)
    return row
  }

  const existing = await findExisting()
  if (existing) return existing

  const [inserted] = await sqlConn
    .insert(schema.categories)
    .values({ name: trimmed, userId })
    .onConflictDoNothing()
    .returning({ id: schema.categories.id, name: schema.categories.name })
  if (inserted) return inserted

  const winner = await findExisting()
  if (!winner) throw new Error("Couldn't create category")
  return winner
}

export async function createItem(input: ItemFormValues) {
  const userId = await retrieveUserId()

  const data = itemFormSchema.parse(input)
  let categoryId = data.categoryId
  if (categoryId === "NEW_CATEGORY") {
    if (!data.newCategoryName) throw new Error("New category name is required")
    const newCategory = await createCategory(data.newCategoryName)
    categoryId = newCategory.id
  }

  try {
    const result = await sqlConn
      .insert(schema.items)
      .values({
        name: data.name,
        categoryId,
        season: data.season,
        colours: data.colours,
        userId: userId,
      })
      .returning({ id: schema.items.id, name: schema.items.name })
    return result[0]
  } catch (error) {
    console.error("Error creating item:", error)
    throw error
  }
}

async function assertOwnsItem(userId: string, itemId: string) {
  const item = await sqlConn.query.items.findFirst({
    where: and(eq(schema.items.id, itemId), eq(schema.items.userId, userId)),
    columns: { id: true },
  })
  if (!item) throw new Error("Item not found")
}

function imageKeys(
  userId: string,
  itemId: string,
  imageId: string,
  type: ImageType
) {
  const base = `users/${userId}/items/${itemId}/${imageId}`
  const ext = IMAGE_TYPES[type]
  return { fullKey: `${base}.${ext}`, thumbKey: `${base}-thumb.${ext}` }
}

export async function requestImageUpload(input: ImageRequestValues) {
  const userId = await retrieveUserId()
  const data = imageRequestSchema.parse(input)
  await assertOwnsItem(userId, data.itemId)

  const existing = await sqlConn.$count(
    schema.itemImages,
    eq(schema.itemImages.itemId, data.itemId)
  )
  if (existing >= MAX_IMAGES_PER_ITEM) {
    throw new Error("This item already has the maximum number of images")
  }

  const imageId = crypto.randomUUID()
  const { fullKey, thumbKey } = imageKeys(
    userId,
    data.itemId,
    imageId,
    data.contentType
  )
  const [fullUrl, thumbUrl] = await Promise.all([
    createUploadUrl(fullKey, data.contentType, data.fullSize),
    createUploadUrl(thumbKey, data.contentType, data.thumbSize),
  ])
  return { imageId, fullUrl, thumbUrl }
}

export async function confirmImageUpload(input: ImageConfirmValues) {
  const userId = await retrieveUserId()
  const data = imageConfirmSchema.parse(input)
  await assertOwnsItem(userId, data.itemId)

  const { fullKey, thumbKey } = imageKeys(
    userId,
    data.itemId,
    data.imageId,
    data.contentType
  )
  const [fullSize, thumbSize] = await Promise.all([
    objectSize(fullKey),
    objectSize(thumbKey),
  ])

  const cleanup = () =>
    Promise.allSettled([deleteObject(fullKey), deleteObject(thumbKey)])

  if (fullSize !== data.fullSize || thumbSize !== data.thumbSize) {
    await cleanup()
    throw new Error("Upload did not complete correctly")
  }

  const existing = await sqlConn
    .select({ position: schema.itemImages.position })
    .from(schema.itemImages)
    .where(eq(schema.itemImages.itemId, data.itemId))
  if (existing.length >= MAX_IMAGES_PER_ITEM) {
    await cleanup()
    throw new Error("This item already has the maximum number of images")
  }
  const position = existing.length
    ? Math.max(...existing.map((e) => e.position)) + 1
    : 0

  const [row] = await sqlConn
    .insert(schema.itemImages)
    .values({
      itemId: data.itemId,
      userId,
      storageKey: fullKey,
      thumbKey,
      contentType: data.contentType,
      sizeBytes: fullSize,
      position,
    })
    .returning({ id: schema.itemImages.id })
  return row
}
