import { z } from "zod"
import { seasonEnum } from "@/db/schema"
import { COLOUR_NAMES, NEW_CATEGORY } from "@/lib/constants"
import {
  MAX_FULL_BYTES,
  MAX_THUMB_BYTES,
  IMAGE_TYPE_LIST,
} from "@/lib/image-config"

export const passwordSchema = z
  .string()
  .min(8, { message: "Be at least 8 characters long." })
  .regex(/[a-zA-Z]/, { message: "Contain at least one letter." })
  .regex(/[0-9]/, { message: "Contain at least one number." })
  .regex(/[^a-zA-Z0-9]/, {
    message: "Contain at least one special character.",
  })

export const itemFormSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    categoryId: z.string().min(1, "Category is required"),
    newCategoryName: z.string().trim().optional(),
    season: z.enum(seasonEnum.enumValues, { message: "Invalid season" }),
    colours: z
      .array(z.enum(COLOUR_NAMES))
      .min(1, "Pick at least one colour")
      .transform((c) => [...new Set(c)]),
  })
  .refine((d) => d.categoryId !== NEW_CATEGORY || !!d.newCategoryName, {
    message: "Enter a name for the new category",
    path: ["categoryId"],
  })

export type ItemFormValues = z.infer<typeof itemFormSchema>

export const imageRequestSchema = z.object({
  itemId: z.string().uuid(),
  contentType: z.enum(IMAGE_TYPE_LIST),
  fullSize: z.number().int().positive().max(MAX_FULL_BYTES),
  thumbSize: z.number().int().positive().max(MAX_THUMB_BYTES),
})

export type ImageRequestValues = z.infer<typeof imageRequestSchema>

export const imageConfirmSchema = imageRequestSchema.extend({
  imageId: z.string().uuid(),
})

export type ImageConfirmValues = z.infer<typeof imageConfirmSchema>
