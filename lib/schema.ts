import { z } from "zod"
import { seasonEnum } from "@/db/schema"
import { COLOUR_NAMES } from "@/lib/constants"

export const passwordSchema = z
  .string()
  .min(8, { message: "Be at least 8 characters long." })
  .regex(/[a-zA-Z]/, { message: "Contain at least one letter." })
  .regex(/[0-9]/, { message: "Contain at least one number." })
  .regex(/[^a-zA-Z0-9]/, {
    message: "Contain at least one special character.",
  })

export const itemFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  season: z.enum(seasonEnum.enumValues, { message: "Invalid season" }),
  colours: z
    .array(z.enum(COLOUR_NAMES))
    .min(1, "Pick at least one colour")
    .transform((c) => [...new Set(c)]),
})

export type ItemFormValues = z.infer<typeof itemFormSchema>
