"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  Controller,
  useForm,
  type FieldError as RHFFieldError,
} from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PasswordRequirementsHover } from "@/components/password-requirements-hover"
import { authClient } from "@/lib/auth-client"
import { changePasswordSchema, type ChangePasswordValues } from "@/lib/schema"
import { runAuthAction } from "@/components/account/run-auth-action"

const emptyValues: ChangePasswordValues = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  revokeSessions: true,
}

function messagesOf(error?: RHFFieldError) {
  if (!error) return []
  const all = error.types ? Object.values(error.types).flat() : [error.message]
  return all
    .filter((m): m is string => typeof m === "string")
    .map((message) => ({ message }))
}

export function PasswordForm() {
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    criteriaMode: "all",
    defaultValues: emptyValues,
  })
  const { isSubmitting, isDirty } = form.formState

  async function onSubmit(data: ChangePasswordValues) {
    const ok = await runAuthAction(
      () =>
        authClient.changePassword({
          newPassword: data.newPassword,
          currentPassword: data.currentPassword,
          revokeOtherSessions: data.revokeSessions,
        }),
      "Password updated.",
      "Failed to update password."
    )
    if (ok) form.reset()
  }

  return (
    <form
      id="password-reset-form"
      onSubmit={form.handleSubmit(onSubmit)}
      className="mt-4 grid gap-3"
    >
      <Controller
        name="currentPassword"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="grid gap-3">
            <FieldLabel htmlFor="current-password">Current Password</FieldLabel>
            <Input
              {...field}
              id="current-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="newPassword"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="grid gap-3">
            <FieldLabel htmlFor="new-password">
              New Password <PasswordRequirementsHover />
            </FieldLabel>
            <Input
              {...field}
              id="new-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && (
              <>
                <p className="text-sm text-destructive">New password must:</p>
                <FieldError errors={messagesOf(fieldState.error)} />
              </>
            )}
          </Field>
        )}
      />
      <Controller
        name="confirmPassword"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="grid gap-3">
            <FieldLabel htmlFor="confirm-password">
              Confirm New Password
            </FieldLabel>
            <Input
              {...field}
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name="revokeSessions"
        control={form.control}
        render={({ field }) => (
          <Field orientation="horizontal">
            <Checkbox
              id="revoke-sessions"
              name={field.name}
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked)}
            />
            <FieldLabel htmlFor="revoke-sessions">
              Sign out of all other devices?
            </FieldLabel>
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
