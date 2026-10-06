"use client"
import { Card } from "@/components/ui/card"
import { WardrobeItem } from "@/lib/definitions"
import { retrieveCategoryById } from "@/lib/data"
import { authClient } from "@/lib/auth-client"

export default function ClothingCard({ item }: { item: WardrobeItem }) {
  const { data: session, isPending, error, refetch } = authClient.useSession()

  const category =
    session && item.categoryId
      ? retrieveCategoryById(item.categoryId, session.user.id)
      : null

  return (
    <Card>
      <h3>{item.name}</h3>
      <p>Category: test</p>
      <p>Season: {item.season}</p>
      <p>Colour: {item.color}</p>
    </Card>
  )
}
