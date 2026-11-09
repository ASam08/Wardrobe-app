import { seasonEnum } from "@/db/schema"
import { COLOUR_NAMES } from "@/lib/constants"
import type { ColourName } from "@/lib/constants"
import type { Season, WardrobeItem } from "@/lib/definitions"
import type { FilterFormValues } from "@/lib/schema"

const isSeason = (v: string): v is Season =>
  (seasonEnum.enumValues as readonly string[]).includes(v)

const isColour = (v: string): v is ColourName =>
  (COLOUR_NAMES as readonly string[]).includes(v)

const FILTER_KEYS = ["category", "season", "colour"] as const

export function filtersFromSearchParams(
  params: Pick<URLSearchParams, "get">,
  validCategoryIds: Set<string>
): FilterFormValues {
  const list = (key: string) =>
    params.get(key)?.split(",").filter(Boolean) ?? []
  return {
    categoryIds: list("categoryIds").filter((id) => validCategoryIds.has(id)),
    seasons: list("seasons").filter(isSeason),
    colours: list("colours").filter(isColour),
  }
}

export function applyFilters(items: WardrobeItem[], filters: FilterFormValues) {
  const { categoryIds = [], seasons = [], colours = [] } = filters
  return items.filter((item) => {
    if (
      categoryIds.length &&
      (!item.categoryId || !categoryIds.includes(item.categoryId))
    )
      return false
    if (seasons.length && (!item.season || !seasons.includes(item.season)))
      return false
    if (
      colours.length &&
      !(item.colours ?? []).some((c) => colours.includes(c))
    )
      return false
    return true
  })
}
