"use client"

import { WardrobeItem } from "@/lib/definitions";

export default function WardrobeGrid({ items }: { items: WardrobeItem[] }) {
    if (items.length === 0) {
        return (
            <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">
                    Your wardrobe is empty. Add some items to get started!
                </p>
            </div>);
}
    return (
      <div>
        <h1>Wardrobe Grid</h1>
    </div>
  )
}