"use client"

import type { User } from "better-auth"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PersonalForm } from "@/components/account/personal-form"
import { EmailForm } from "@/components/account/email-form"
import { PasswordForm } from "@/components/account/password-form"

function AccountSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="max-w-96">
      <div className="gap-4 text-lg font-bold">{title}</div>
      <Separator />
      {children}
    </div>
  )
}

export default function AccountForm({ user }: { user: User }) {
  return (
    <Tabs defaultValue="personal">
      <TabsList>
        <TabsTrigger value="personal">Personal</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="personal">
        <AccountSection title="Personal">
          <PersonalForm user={user} />
        </AccountSection>
      </TabsContent>
      <TabsContent value="email">
        <AccountSection title="Email">
          <EmailForm user={user} />
        </AccountSection>
      </TabsContent>
      <TabsContent value="password">
        <AccountSection title="Password">
          <PasswordForm />
        </AccountSection>
      </TabsContent>
    </Tabs>
  )
}
