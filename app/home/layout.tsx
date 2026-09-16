import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SiteHeader } from "@/components/site-header"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/sign-in")

  return (
    <div className="relative min-h-screen max-w-screen">
      <SiteHeader user={session.user} />
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
