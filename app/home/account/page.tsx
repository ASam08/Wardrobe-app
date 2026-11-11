import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
// import AccountForm from "@/app/ui/account/accountform";

export default async function AccountPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const user_id = session?.user?.id
  if (!user_id) {
    redirect("/login")
  }

  return (
    <div className="flex h-full max-w-screen flex-col px-3 md:px-2">
      <h1 className="flex flex-wrap text-2xl font-bold text-gray-800 md:mb-4 dark:text-gray-200">
        Account
      </h1>
      <p className="text-gray-700 dark:text-gray-300">
        Welcome, {session.user.name}! This is your account page.
      </p>
      <p className="text-gray-700 dark:text-gray-300">
        Your email: {session.user.email}
      </p>
      <p className="text-gray-700 dark:text-gray-300">
        Your user ID: {session.user.id}
      </p>
    </div>
  )
}
