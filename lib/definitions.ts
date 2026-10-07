import * as schema from "@/db/schema"

export type Season = (typeof schema.seasonEnum.enumValues)[number]

export type WardrobeItem = {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  userId: string
  season: Season | null
  categoryId: string | null
  color: string | null
  notes: string | null
  category: {
    id: string
    name: string
  } | null
}
