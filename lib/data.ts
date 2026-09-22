"use server"

import { sqlConn } from "@/lib/db"
import * as schema from "@/db/schema"
import { eq, or, isNull } from "drizzle-orm"

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
