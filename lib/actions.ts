"use server"

import { sqlConn } from "@/lib/db"
import * as schema from "@/db/schema"
import { eq, or, isNull } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function createCategory(name: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    throw new Error("User is not authenticated")
  }

  try {
    const result = await sqlConn
      .insert(schema.categories)
      .values({
        name,
        userId: session.user.id,
      })
      .returning({
        insertedId: schema.categories.id,
        name: schema.categories.name,
      })
    return result[0]
  } catch (error) {
    console.error("Error creating category:", error)
    throw error
  }
}
