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
import ClothingOpenCard from "@/components/clothing-open-card"

export default function WardrobeGrid({ items }: { items: WardrobeItem[] }) {
  const [openItem, setOpenItem] = useState<string | null>(null)
  const [openCard, setOpenCard] = useState(false)
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
      {items.map((item) => (
        <ClothingGridCard
          item={item}
          key={item.id}
          onClick={() => {
            setOpenItem(item.id)
            setOpenCard(true)
          }}
        />
      ))}

      <Dialog open={openCard && !!selected} onOpenChange={setOpenCard}>
        <DialogContent className="max-h-full">
          {selected && <ClothingOpenCard item={selected} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
