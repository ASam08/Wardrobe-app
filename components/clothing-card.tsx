"use client"
import { Card } from "@/components/ui/card"
import { WardrobeItem } from "@/lib/definitions"
import { authClient } from "@/lib/auth-client"

export default function ClothingCard({ item }: { item: WardrobeItem }) {
  const { data: session, isPending, error, refetch } = authClient.useSession()

  return (
    <Card className="p-2">
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
    </Card>
  )
}
