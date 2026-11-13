"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import type { User } from "better-auth"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { verifyUserPassword } from "@/lib/data"
import {
  emailFormSchema,
  verifyPasswordSchema,
  type EmailFormValues,
  type VerifyPasswordValues,
} from "@/lib/schema"
import { runAuthAction } from "@/components/account/run-auth-action"

export function EmailForm({ user }: { user: User }) {
  const router = useRouter()
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: { email: user.email },
    values: { email: user.email },
  })
  const verifyForm = useForm<VerifyPasswordValues>({
    resolver: zodResolver(verifyPasswordSchema),
    defaultValues: { password: "" },
  })
  const { isDirty } = form.formState
  const verifying = verifyForm.formState.isSubmitting

  function closeVerifyDialog() {
    setPendingEmail(null)
    verifyForm.reset()
  }

  function onSubmit(data: EmailFormValues) {
    if (data.email === user.email) return
    setPendingEmail(data.email)
  }

  async function onVerify({ password }: VerifyPasswordValues) {
    if (!pendingEmail) return
    const verified = await verifyUserPassword(password)
    if (!verified) {
      verifyForm.setError("password", { message: "Incorrect password" })
      return
    }
    const ok = await runAuthAction(
      () =>
        authClient.changeEmail({
          newEmail: pendingEmail,
          callbackURL: "/dashboard",
        }),
      "Email updated.",
      "Failed to update email."
    )
    closeVerifyDialog()
    if (ok) router.refresh()
  }

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 grid gap-3">
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="grid gap-3">
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                {...field}
                id="email"
                type="email"
                autoComplete="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="flex flex-row gap-4 py-4">
          <Button
            variant="outline"
            type="button"
            disabled={!isDirty}
            onClick={() => form.reset()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!isDirty}>
            Save Changes
          </Button>
        </div>
      </form>

      <Dialog
        open={pendingEmail !== null}
        onOpenChange={(open) => {
          if (!open && !verifying) closeVerifyDialog()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Password</DialogTitle>
            <DialogDescription>
              Please enter your current password to confirm it&apos;s you.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3"
            onSubmit={verifyForm.handleSubmit(onVerify)}
          >
            <Controller
              name="password"
              control={verifyForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="grid gap-3">
                  <FieldLabel htmlFor="verify-password">
                    Current Password
                  </FieldLabel>
                  <Input
                    {...field}
                    id="verify-password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <DialogFooter>
              <DialogClose
                render={
                  <Button variant="outline" type="button" disabled={verifying}>
                    Cancel
                  </Button>
                }
              />
              <Button type="submit" disabled={verifying}>
                Verify
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
