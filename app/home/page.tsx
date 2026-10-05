import { CreateItemForm } from "@/components/create-item-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { auth } from "@/lib/auth"
import { retrieveCategories, retrieveItems } from "@/lib/data"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { WardrobeItem } from "@/lib/definitions"
import WardrobeGrid from "@/components/wardrobe-grid"

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    redirect("/login")
  }

  const categories = await retrieveCategories(session.user.id)
  const retrievedItems: WardrobeItem[] = await retrieveItems(session.user.id)

  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      {session ? (
        <p>You are logged in as {session.user.name}</p>
      ) : (
        <p>You are not logged in.</p>
      )}

      <Dialog>
        <DialogTrigger render={<Button>Create Item</Button>} />
        <DialogContent>
          <CreateItemForm categories={categories} />
        </DialogContent>
      </Dialog>

      <WardrobeGrid items={retrievedItems} />
    </div>
  )
}
