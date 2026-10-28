"use client"

import * as React from "react"
import { useController, type Control } from "react-hook-form"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { NEW_CATEGORY } from "@/lib/constants"
import type { ItemFormValues } from "@/lib/schema"

type Option = { id: string; name: string; creatable?: string }

export function CategoryField({
  control,
  categories,
}: {
  control: Control<ItemFormValues>
  categories: { id: string; name: string }[]
}) {
  const { field, fieldState } = useController({ name: "categoryId", control })
  const { field: newName } = useController({ name: "newCategoryName", control })
  const [query, setQuery] = React.useState("")

  React.useEffect(() => {
    if (!field.value) setQuery("")
  }, [field.value])

  const pending = React.useMemo<Option | null>(
    () =>
      field.value === NEW_CATEGORY && newName.value
        ? { id: NEW_CATEGORY, name: newName.value }
        : null,
    [field.value, newName.value]
  )

  const typed = query.trim()
  const options = React.useMemo<Option[]>(() => {
    const base: Option[] = pending ? [...categories, pending] : categories
    const taken = base.some(
      (c) => c.name.trim().toLowerCase() === typed.toLowerCase()
    )
    return typed && !taken
      ? [
          ...base,
          {
            id: `create:${typed}`,
            name: `Create "${typed}"`,
            creatable: typed,
          },
        ]
      : base
  }, [categories, pending, typed])

  const selected: Option | null =
    pending ?? categories.find((c) => c.id === field.value) ?? null

  function handleChange(option: Option | null) {
    if (option?.creatable) {
      field.onChange(NEW_CATEGORY)
      newName.onChange(option.creatable)
      setQuery(option.creatable)
    } else {
      field.onChange(option?.id ?? "")
      newName.onChange("")
      setQuery(option?.name ?? "")
    }
  }

  return (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor="create-item-category">Category</FieldLabel>
      <Combobox
        items={options}
        itemToStringLabel={(o: Option) => o.creatable ?? o.name}
        value={selected}
        onValueChange={handleChange}
        inputValue={query}
        onInputValueChange={setQuery}
        name={field.name}
      >
        <ComboboxInput
          id="create-item-category"
          placeholder="Search or create a category"
          aria-invalid={fieldState.invalid}
          autoComplete="off"
        />
        <ComboboxContent>
          <ComboboxEmpty>No categories found</ComboboxEmpty>
          <ComboboxList>
            {(option: Option) => (
              <ComboboxItem key={option.id} value={option}>
                {option.name}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )
}
