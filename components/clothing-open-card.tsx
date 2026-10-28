"use client"
import { Card } from "@/components/ui/card"
import type { WardrobeItem } from "@/lib/definitions"
import { DeleteItemButton } from "./delete-item-button"

export default function ClothingOpenCard({ item }: { item: WardrobeItem }) {
  return (
    <Card className="p-2">
      <div className="aspect-4/5 w-full overflow-hidden rounded-md bg-muted">
        {item.fullUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- presigned S3 URL, small thumbnail
          <img
            src={item.fullUrl}
            alt={item.name}
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <h3>{item.name}</h3>
      <p>Category: {item.category?.name || "None"}</p>
      <p>
        Season:{" "}
        {item.season
          ? item.season.charAt(0).toUpperCase() + item.season.slice(1)
          : "None"}
      </p>
      {item.colours &&
        item.colours.length > 0 &&
        (item.colours.length == 1 ? (
          <p>Colour: {item.colours[0]}</p>
        ) : (
          <p>Colours: {item.colours.join(", ")}</p>
        ))}
      <DeleteItemButton itemId={item.id} itemName={item.name} />
    </Card>
  )
}
