"use client"
import { Card } from "@/components/ui/card"
import { WardrobeItem } from "@/lib/definitions"
import { authClient } from "@/lib/auth-client"

export default function ClothingCard({ item }: { item: WardrobeItem }) {
  const { data: session, isPending, error, refetch } = authClient.useSession()

  return (
    <Card>
      <h3>{item.name}</h3>
      <p>Category: {item.category?.name || "None"}</p>
      <p>Season: {item.season}</p>
      <p>Colour: {item.color}</p>
    </Card>
  )
}
