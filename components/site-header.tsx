import Link from "next/link"
import { UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { SignOutButton } from "@/components/sign-out-button"
import type { User } from "@/lib/auth"

export function SiteHeader({ user }: { user: User }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-14 items-center justify-between px-4">
        <Button
          variant="ghost"
          render={<Link href="/" />}
          nativeButton={false}
          className="px-2"
        >
          <h1 className="text-lg font-medium md:text-xl">Your Wardrobe</h1>
        </Button>

        <nav className="flex items-center space-x-2">
          <ModeToggle />

          <Button
            variant="ghost"
            render={<Link href="/account" />}
            nativeButton={false}
            className="hidden items-center space-x-2 md:flex"
          >
            <UserCircle className="h-[1.2rem] w-[1.2rem]" />
            <span className="max-w-50 truncate text-sm text-muted-foreground">
              {user.name || user.email}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            render={<Link href="/account" />}
            nativeButton={false}
            className="h-9 w-9 md:hidden"
          >
            <UserCircle className="h-[1.2rem] w-[1.2rem]" />
          </Button>

          <SignOutButton />
        </nav>
      </div>
    </header>
  )
}
