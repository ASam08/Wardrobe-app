"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldLabel } from "@/components/ui/field"
import { useId } from "react"

interface FilterProps {
  label: string
  field: string
  value: string
  operator: string
  currentFilter: string
}

export default function TableFilters({
  label,
  field,
  value,
  operator,
  currentFilter,
}: FilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = useId()

  const filterString = [field, value, operator].join("--")
  const isActive = currentFilter === filterString

  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (isActive) {
      params.delete("filterField")
      params.delete("filterValue")
      params.delete("filterOperator")
      params.set("page", "1")
      router.push("?" + params.toString())
    } else {
      params.set("filterField", field)
      params.set("filterValue", value)
      params.set("filterOperator", operator)
      params.set("page", "1")
      router.push("?" + params.toString())
    }
  }

  return (
    <Field orientation="horizontal" className="w-fit cursor-pointer">
      <Checkbox id={id} onCheckedChange={handleClick} checked={isActive} />
      <FieldLabel htmlFor={id} className="cursor-pointer">
        {label}
      </FieldLabel>
    </Field>
  )
}
