"use server"

import { sqlConn } from "@/lib/db"
import * as schema from "@/db/schema"
import { eq, or, isNull, and } from "drizzle-orm"

export async function retrieveCategories(userId: string) {
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

export async function retrieveCategoryById(categoryId: string, userId: string) {
  try {
    const result = await sqlConn
      .select()
      .from(schema.categories)
      .where(
        and(
          eq(schema.categories.id, categoryId),
          or(
            eq(schema.categories.userId, userId),
            isNull(schema.categories.userId)
          )
        )
      )
    return result[0]
  } catch (error) {
    console.error("Error retrieving category by ID:", error)
    throw error
  }
}

export async function retrieveItems(userId: string) {
  try {
    const result = await sqlConn
      .select()
      .from(schema.items)
      .where(eq(schema.items.userId, userId))
    return result
  } catch (error) {
    console.error("Error retrieving items:", error)
    throw error
  }
}
