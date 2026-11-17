"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import type { User } from "better-auth"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { editUserSchema, type EditUserValues } from "@/lib/schema"

export function EditUserDialog({
  chosenUser,
  open,
  onOpenChange,
}: {
  chosenUser: User
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const form = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: chosenUser.name, email: chosenUser.email },
    values: { name: chosenUser.name, email: chosenUser.email },
  })
  const { isSubmitting, isDirty } = form.formState

  function handleOpenChange(next: boolean) {
    if (!next && isSubmitting) return
    if (!next) form.reset()
    onOpenChange(next)
  }

  async function onSubmit(data: EditUserValues) {
    try {
      if (data.email !== chosenUser.email.toLowerCase()) {
        const { data: found } = await authClient.admin.listUsers({
          query: {
            filterField: "email",
            filterValue: data.email,
            filterOperator: "eq",
            limit: 1,
          },
        })
        if (found?.users?.some((u) => u.id !== chosenUser.id)) {
          form.setError("email", {
            message: "An account with this email already exists.",
          })
          return
        }
      }

      const { error } = await authClient.admin.updateUser({
        userId: chosenUser.id,
        data: { name: data.name, email: data.email },
      })
      if (error) {
        form.setError("root", {
          message: error.message ?? "Couldn't save changes. Please try again.",
        })
        return
      }
    } catch {
      form.setError("root", {
        message: "Couldn't save changes. Please try again.",
      })
      return
    }

    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="edit-user-name">Name</FieldLabel>
                <Input
                  {...field}
                  id="edit-user-name"
                  autoComplete="off"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="edit-user-email">Email</FieldLabel>
                <Input
                  {...field}
                  id="edit-user-email"
                  type="email"
                  autoComplete="off"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          {form.formState.errors.root && (
            <p className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
