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
import { retrieveCategories } from "@/lib/data"

const itemFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  season: z.enum(["spring", "summer", "autumn", "winter"], {
    message: "Invalid season",
  }),
  colour: z.string().min(1, "Colour is required"),
})

export function CreateItemForm({
  categories,
}: {
  categories: { id: string; name: string }[]
}) {
  const form = useForm<z.infer<typeof itemFormSchema>>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      categoryId: "",
      season: "spring",
      colour: "",
    },
  })
  function onSubmit(data: z.infer<typeof itemFormSchema>) {
    // TODO: Handle form submission, e.g., send data to the server
    console.log(data)
  }
  const seasons = {
    spring: "Spring",
    summer: "Summer",
    autumn: "Autumn",
    winter: "Winter",
  }
  const seasonItems = Object.entries(seasons).map(([value, label]) => ({
    value,
    label,
  }))

  const oldCategories = categories.map((category) => ({
    1: "Shirts",
    2: "Pants",
    3: "Shoes",
    4: "Accessories",
  }))
  const categoryItems = Object.entries(categories).map(([id, name]) => ({
    id,
    name,
  }))

  return (
    <form id="create-item-form" onSubmit={form.handleSubmit(onSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle>Create Item</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="create-item-name">Item Name</FieldLabel>
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
                  items={seasonItems}
                  value={field.value}
                  onValueChange={field.onChange}
                  name={field.name}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a season" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(seasons).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
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
                <Input
                  {...field}
                  id="create-item-colour"
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
        </CardContent>
        <CardFooter>
          <Field orientation="horizontal">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Reset
            </Button>
            <Button type="submit" form="create-item-form">
              Submit
            </Button>
          </Field>
        </CardFooter>
      </Card>
    </form>
  )
}
