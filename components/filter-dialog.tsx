"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Field, FieldLabel } from "@/components/ui/field"
import { COLOURS } from "@/lib/constants"
import { seasonEnum } from "@/db/schema"
import { filterFormSchema, type FilterFormValues } from "@/lib/schema"
import { capitalise } from "@/lib/utils"
import { useState } from "react"
import { useSearchParams } from "next/navigation"

export function FilterDialog({
  categories,
}: {
  categories: { id: string; name: string }[]
}) {
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(filterFormSchema),
    defaultValues: {
      colours: [],
      seasons: [],
      categoryIds: useSearchParams().getAll("categoryIds") || [],
    },
  })
  const [open, setOpen] = useState(false)

  function onSubmit(data: FilterFormValues) {
    const params = new URLSearchParams()
    if (data.colours?.length) params.set("colours", data.colours.join(","))
    if (data.seasons?.length) params.set("seasons", data.seasons.join(","))
    if (data.categoryIds?.length)
      params.set("categoryIds", data.categoryIds.join(","))

    const qs = params.toString()
    window.history.replaceState(
      null,
      "",
      qs ? `?${qs}` : window.location.pathname
    )
    setOpen(false)
  }

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: capitalise(category.name),
  }))

  const seasonOptions = seasonEnum.enumValues.map((value) => ({
    value,
    label: capitalise(value),
  }))

  const colourOptions = Object.entries(COLOURS).map(([name, hex]) => ({
    value: name,
    label: name,
    hex,
  }))
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline">
            Filter <Filter className="ml-2 h-4 w-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Filter Items</DialogTitle>
        </DialogHeader>
        <form
          id="filter-form"
          className="space-y-4"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <Controller
            name="categoryIds"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="category-filter">Categories</FieldLabel>
                <Select
                  multiple
                  items={categoryOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  name={field.name}
                >
                  <SelectTrigger id="category-filter">
                    <SelectValue placeholder="Select categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Controller
            name="seasons"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="season-filter">Seasons</FieldLabel>
                <Select
                  multiple
                  items={seasonOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  name={field.name}
                >
                  <SelectTrigger id="season-filter">
                    <SelectValue placeholder="Select seasons" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasonOptions.map((season) => (
                      <SelectItem key={season.value} value={season.value}>
                        {season.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Controller
            name="colours"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="colour-filter">Colours</FieldLabel>
                <Select
                  multiple
                  items={colourOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  name={field.name}
                >
                  <SelectTrigger id="colour-filter">
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
              </Field>
            )}
          />
          <div className="mt-4 flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
            >
              Reset
            </Button>
            <Button type="submit">Apply Filters</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
