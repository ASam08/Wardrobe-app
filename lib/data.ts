"use server"

import { sqlConn } from "@/lib/db"
import * as schema from "@/db/schema"
import { eq, or, isNull, asc } from "drizzle-orm"
import { createDownloadUrl } from "@/lib/s3"
import { retrieveUserId } from "@/lib/actions"

export async function retrieveCategories() {
  const userId = await retrieveUserId()
  try {
    const result = await sqlConn
      .select()
      .from(schema.categories)
      .where(
        or(
          eq(schema.categories.userId, userId),
          isNull(schema.categories.userId)
        )
      )
    return result
  } catch (error) {
    console.error("Error retrieving categories:", error)
    throw error
  }
}

export async function retrieveItems() {
  const userId = await retrieveUserId()
  try {
    const rows = await sqlConn.query.items.findMany({
      where: eq(schema.items.userId, userId),
      with: {
        category: true,
        images: { orderBy: [asc(schema.itemImages.position)], limit: 1 },
      },
    })

    return Promise.all(
      rows.map(async ({ images, ...item }) => ({
        ...item,
        thumbUrl: images[0]
          ? await createDownloadUrl(images[0].thumbKey)
          : null,
      }))
    )
  } catch (error) {
    console.error("Error retrieving items:", error)
    throw error
  }
}
