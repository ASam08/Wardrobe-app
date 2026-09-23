"use server"

import { sqlConn } from "@/lib/db"
import * as schema from "@/db/schema"
import { eq, or, isNull } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

type Season = (typeof schema.seasonEnum.enumValues)[number]

function isSeason(value: string): value is Season {
  return (schema.seasonEnum.enumValues as readonly string[]).includes(value)
}

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
        id: schema.categories.id,
        name: schema.categories.name,
      })
    return result[0]
  } catch (error) {
    console.error("Error creating category:", error)
    throw error
  }
}
type CreateItemInput = {
  name: string
  categoryId: string
  season: (typeof schema.seasonEnum.enumValues)[number]
  colour: string
  newCategoryName?: string
}

export async function createItem(data: CreateItemInput) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("User is not authenticated")

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
        color: data.colour,
        userId: session.user.id,
      })
      .returning({ id: schema.items.id, name: schema.items.name })
    return result[0]
  } catch (error) {
    console.error("Error creating item:", error)
    throw error
  }
}
