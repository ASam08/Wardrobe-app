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
  replaceImageId: z.string().uuid().optional(),
})

export type ImageRequestValues = z.infer<typeof imageRequestSchema>

export const imageConfirmSchema = imageRequestSchema.extend({
  imageId: z.string().uuid(),
})

export type ImageConfirmValues = z.infer<typeof imageConfirmSchema>

export const filterFormSchema = z.object({
  colours: z.array(z.enum(COLOUR_NAMES)).optional(),
  seasons: z.array(z.enum(seasonEnum.enumValues)).optional(),
  categoryIds: z.array(z.string()).optional(),
})

export type FilterFormValues = z.infer<typeof filterFormSchema>

export const personalFormSchema = z.object({
  name: z.string().trim().min(1, "Name cannot be empty"),
})
export type PersonalFormValues = z.infer<typeof personalFormSchema>

export const emailFormSchema = z.object({
  email: z.string().email("Invalid email address"),
})
export type EmailFormValues = z.infer<typeof emailFormSchema>

export const verifyPasswordSchema = z.object({
  password: z.string().min(1, "Enter your password"),
})
export type VerifyPasswordValues = z.infer<typeof verifyPasswordSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
    revokeSessions: z.boolean(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
