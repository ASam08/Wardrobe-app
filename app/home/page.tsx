import { ItemDialog } from "@/components/item-dialog"
import { auth } from "@/lib/auth"
import { retrieveCategories, retrieveItems } from "@/lib/data"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { WardrobeItem } from "@/lib/definitions"
import WardrobeGrid from "@/components/wardrobe-grid"
import { FilterDialog } from "@/components/filter-dialog"

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    redirect("/login")
  }

  const categories = await retrieveCategories()
  const retrievedItems: WardrobeItem[] = await retrieveItems()

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold">Your Wardrobe</h2>
      <div className="mb-4 flex items-center justify-between">
        <ItemDialog categories={categories} calledType="create" />
        <FilterDialog categories={categories} />
      </div>

      <WardrobeGrid items={retrievedItems} categories={categories} />
    </div>
  )
}
