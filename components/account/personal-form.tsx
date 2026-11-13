"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import type { User } from "better-auth"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { personalFormSchema, type PersonalFormValues } from "@/lib/schema"
import { runAuthAction } from "@/components/account/run-auth-action"

export function PersonalForm({ user }: { user: User }) {
  const router = useRouter()
  const form = useForm<PersonalFormValues>({
    resolver: zodResolver(personalFormSchema),
    defaultValues: { name: user.name },
    values: { name: user.name }, // re-syncs when router.refresh() brings a new user
  })
  const { isSubmitting, isDirty } = form.formState

  async function onSubmit(data: PersonalFormValues) {
    const ok = await runAuthAction(
      () => authClient.updateUser({ name: data.name }),
      "Personal information updated.",
      "Failed to update personal information."
    )
    if (ok) router.refresh()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 grid gap-3">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="grid gap-3">
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              {...field}
              id="name"
              type="text"
              autoComplete="name"
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
          disabled={!isDirty || isSubmitting}
          onClick={() => form.reset()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          Save Changes
        </Button>
      </div>
    </form>
  )
}
