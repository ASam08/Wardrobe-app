"use server"

import { sqlConn } from "@/lib/db"
import * as schema from "@/db/schema"
import { eq, or, isNull, and, sql } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { Season } from "@/lib/definitions"
import { itemFormSchema, type ItemFormValues } from "@/lib/schema"

function isSeason(value: string): value is Season {
  return (schema.seasonEnum.enumValues as readonly string[]).includes(value)
}

export async function createCategory(name: string) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("User is not authenticated")

  const trimmed = name.trim()
  if (!trimmed) throw new Error("Category name is required")
  const userId = session.user.id

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
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("User is not authenticated")

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
        userId: session.user.id,
      })
      .returning({ id: schema.items.id, name: schema.items.name })
    return result[0]
  } catch (error) {
    console.error("Error creating item:", error)
    throw error
  }
}
