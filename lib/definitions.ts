import * as schema from "@/db/schema"
import type { ColourName } from "@/lib/constants"

export type Season = (typeof schema.seasonEnum.enumValues)[number]

export type WardrobeItem = {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  userId: string
  season: Season | null
  categoryId: string | null
  colours: ColourName[] | null
  notes: string | null
  category: {
    id: string
    name: string
  } | null
  thumbUrl: string | null
  fullUrl: string | null
}
