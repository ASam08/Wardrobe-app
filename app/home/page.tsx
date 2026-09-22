import { CreateItemForm } from "@/components/create-item-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { auth } from "@/lib/auth"
import { retrieveCategories } from "@/lib/data"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session) {
    redirect("/login")
  }

  const categories = await retrieveCategories(session.user.id)

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

      {/* <h2>Your Categories:</h2>
      <ul>
        {categories.map((category) => (
          <li key={category.id}>{category.name}</li>
        ))}
      </ul> */}
    </div>
  )
}
