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
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { capitalise } from "@/lib/utils"
import { seasonEnum } from "@/db/schema"
import { createItem } from "@/lib/actions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { COLOURS } from "@/lib/constants"

const itemFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  season: z.enum(seasonEnum.enumValues, {
    message: "Invalid season",
  }),
  colour: z.string().min(1, "Colour is required"),
})

export function CreateItemDialog({
  categories,
}: {
  categories: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const form = useForm<z.infer<typeof itemFormSchema>>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      categoryId: "",
      season: "spring",
      colour: "",
    },
  })
  async function onSubmit(data: z.infer<typeof itemFormSchema>) {
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

  const colourOptions = Object.entries(COLOURS).map(([label, value]) => ({
    value,
    label,
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
              <Controller
                name="categoryId"
                control={form.control}
                render={({ field, fieldState }) => {
                  const selected =
                    categories.find((c) => c.id === field.value) ?? null
                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="create-item-category">
                        Category
                      </FieldLabel>
                      <Combobox
                        items={categories}
                        itemToStringLabel={(item) => item.name}
                        value={selected}
                        onValueChange={(item) => field.onChange(item?.id ?? "")}
                        name={field.name}
                      >
                        <ComboboxInput
                          id="create-item-category"
                          placeholder="Select a category"
                          aria-invalid={fieldState.invalid}
                          autoComplete="off"
                        />
                        <ComboboxContent>
                          <ComboboxEmpty>No results found</ComboboxEmpty>
                          <ComboboxList>
                            {(item) => (
                              <ComboboxItem key={item.id} value={item}>
                                {item.name}
                              </ComboboxItem>
                            )}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )
                }}
              />
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
                      <SelectTrigger>
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
                name="colour"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="create-item-colour">Colour</FieldLabel>
                    <Select
                      items={colourOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      name={field.name}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a colour" />
                      </SelectTrigger>
                      <SelectContent>
                        {colourOptions.map((colour) => (
                          <SelectItem key={colour.value} value={colour.value}>
                            <span
                              className="size-3 shrink-0 self-center rounded-full border"
                              style={{ backgroundColor: colour.value }}
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
