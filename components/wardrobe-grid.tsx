"use client"

import { WardrobeItem } from "@/lib/definitions"
import ClothingGridCard from "@/components/clothing-grid-card"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import ClothingOpenCard from "@/components/clothing-open-card"
import { applyFilters } from "@/lib/filter-functions"
import { useMemo } from "react"
import { useItemFilters } from "@/hooks/use-item-filters"

export default function WardrobeGrid({
  items,
  categories,
}: {
  items: WardrobeItem[]
  categories: { id: string; name: string }[]
}) {
  const [openItem, setOpenItem] = useState<string | null>(null)
  const [openCard, setOpenCard] = useState(false)
  const { filters, activeCount, clearFilters } = useItemFilters(categories)
  const filtered = useMemo(() => applyFilters(items, filters), [items, filters])
  const selected = items.find((i) => i.id === openItem)

  if (items.length === 0) {
    return (
      <div className="col-span-full py-12 text-center">
        <p className="text-muted-foreground">
          Your wardrobe is empty. Add some items to get started!
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
      {filtered.length === 0 ? (
        <div className="col-span-full flex flex-col items-center gap-3 py-12 text-muted-foreground">
          <p>No items match these filters.</p>
          {activeCount > 0 && (
            <Button variant="outline" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        filtered.map((item) => (
          <ClothingGridCard
            item={item}
            key={item.id}
            onClick={() => {
              setOpenItem(item.id)
              setOpenCard(true)
            }}
          />
        ))
      )}

      <Dialog open={openCard && !!selected} onOpenChange={setOpenCard}>
        <DialogContent className="max-h-full">
          {selected && (
            <ClothingOpenCard item={selected} categories={categories} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
