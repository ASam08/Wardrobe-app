"use client"
import { useCallback, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { filtersFromSearchParams } from "@/lib/filter-functions"

export function useItemFilters(categories: { id: string }[]) {
  const searchParams = useSearchParams()
  const validCategoryIds = useMemo(
    () => new Set(categories.map((c) => c.id)),
    [categories]
  )
  const filters = useMemo(
    () => filtersFromSearchParams(searchParams, validCategoryIds),
    [searchParams, validCategoryIds]
  )
  const activeCount =
    (filters.categoryIds?.length ?? 0) +
    (filters.seasons?.length ?? 0) +
    (filters.colours?.length ?? 0)

  const clearFilters = useCallback(() => {
    window.history.replaceState(null, "", window.location.pathname)
  }, [])

  return { filters, activeCount, clearFilters }
}
