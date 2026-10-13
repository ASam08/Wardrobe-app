"use client"
import z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from "@/components/ui/select"
import { CategoryField } from "@/components/category-field"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { capitalise } from "@/lib/utils"
import { seasonEnum } from "@/db/schema"
import { createItem } from "@/lib/actions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { COLOURS, COLOUR_NAMES } from "@/lib/constants"
import { itemFormSchema, type ItemFormValues } from "@/lib/schema"

export function CreateItemDialog({
  categories,
}: {
  categories: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      categoryId: "",
      season: "spring",
      colours: [],
      newCategoryName: "",
    },
  })
  async function onSubmit(data: ItemFormValues) {
    try {
      await createItem(data)
    } catch {
      form.setError("root", {
        message: "Couldn't save the item. Please try again.",
      })
      return
    }
    form.reset()
    setOpen(false)
    router.refresh()
  }
  const seasons = seasonEnum.enumValues.map((value) => ({
    value,
    label: capitalise(value),
  }))

  const colourOptions = Object.entries(COLOURS).map(([name, hex]) => ({
    value: name,
    label: name,
    hex,
  }))

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) form.reset()
      }}
    >
      <DialogTrigger render={<Button>Create Item</Button>} />
      <DialogContent>
        <form id="create-item-form" onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Create Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-item-name">
                      Item Name
                    </FieldLabel>
                    <Input
                      {...field}
                      id="create-item-name"
                      aria-invalid={fieldState.invalid}
                      placeholder=""
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <CategoryField control={form.control} categories={categories} />
              <Controller
                name="season"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-item-season">Season</FieldLabel>
                    <Select
                      items={seasons}
                      value={field.value}
                      onValueChange={field.onChange}
                      name={field.name}
                    >
                      <SelectTrigger id="create-item-season">
                        <SelectValue placeholder="Select a season" />
                      </SelectTrigger>
                      <SelectContent>
                        {seasons.map((season) => (
                          <SelectItem key={season.value} value={season.value}>
                            {season.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="colours"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-item-colours">
                      Colours
                    </FieldLabel>
                    <Select
                      multiple
                      items={colourOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      name={field.name}
                    >
                      <SelectTrigger id="create-item-colours">
                        <SelectValue placeholder="Select colours" />
                      </SelectTrigger>
                      <SelectContent>
                        {colourOptions.map((colour) => (
                          <SelectItem key={colour.value} value={colour.value}>
                            <span
                              className="size-3 shrink-0 self-center rounded-full border"
                              style={{ backgroundColor: colour.hex }}
                            />
                            {colour.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </CardContent>
            {form.formState.errors.root && (
              <p className="px-6 text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <CardFooter>
              <Field orientation="horizontal">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  form="create-item-form"
                  disabled={form.formState.isSubmitting}
                >
                  Submit
                </Button>
              </Field>
            </CardFooter>
          </Card>
        </form>
      </DialogContent>
    </Dialog>
  )
}
