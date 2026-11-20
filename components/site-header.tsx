import Link from "next/link"
import { UserCircle, UserCog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { SignOutButton } from "@/components/sign-out-button"
import type { User } from "@/lib/auth"

export function SiteHeader({ user }: { user: User }) {
  const isAdmin = user.role == "admin"
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="@container flex h-14 items-center justify-between px-4">
        <Button
          variant="ghost"
          render={<Link href="/home" />}
          nativeButton={false}
          className="px-2"
        >
          <h1 className="text-lg font-medium md:text-xl">Your Wardrobe</h1>
        </Button>

        <nav className="flex items-center space-x-2">
          <ModeToggle />
          {isAdmin && (
            <>
              <Button
                variant="default"
                render={<Link href="/home/admin" />}
                nativeButton={false}
                className="hidden items-center space-x-2 md:flex"
              >
                <UserCog className="h-[1.2rem] w-[1.2rem]" />
                <span className="max-w-50 truncate text-sm">Admin</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                render={<Link href="/home/admin" />}
                nativeButton={false}
                className="h-9 w-9 md:hidden"
              >
                <UserCog className="h-[1.2rem] w-[1.2rem]" />
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            render={<Link href="/home/account" />}
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
            render={<Link href="/home/account" />}
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
