import { auth } from "@/lib/auth" // path to your Better Auth server instance
import { headers } from "next/headers"

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  })
  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      {session ? (
        <p>You are logged in as {session.user.name}</p>
      ) : (
        <p>You are not logged in.</p>
      )}
    </div>
  )
}
