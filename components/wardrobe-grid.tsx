"use client"

import { WardrobeItem } from "@/lib/definitions"
import ClothingCard from "./clothing-card"

export default function WardrobeGrid({ items }: { items: WardrobeItem[] }) {
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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <ClothingCard item={item} key={item.id} />
      ))}
    </div>
  )
}
