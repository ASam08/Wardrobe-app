import { toast } from "@/components/ui/toast"

type AuthResult = { error?: { message?: string } | null }

export async function runAuthAction(
  action: () => Promise<AuthResult>,
  successMessage: string,
  fallbackErrorMessage = "Something went wrong."
) {
  const { error } = await action()
  if (error) {
    toast.add({ title: error.message ?? fallbackErrorMessage, type: "error" })
    return false
  }
  toast.add({ title: successMessage, type: "success" })
  return true
}
