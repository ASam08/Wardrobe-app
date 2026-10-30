"use client"
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
import { useEffect, useRef, useState } from "react"
import { COLOURS } from "@/lib/constants"
import { itemFormSchema, type ItemFormValues } from "@/lib/schema"
import {
  prepareImage,
  type PreparedImage,
  uploadPreparedImage,
} from "@/lib/client-actions"

type PickedImage = { prepared: PreparedImage; previewUrl: string }
type SavedItem = { id: string; name: string }

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

  const [image, setImage] = useState<PickedImage | null>(null)
  const [isPreparing, setIsPreparing] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [savedItem, setSavedItem] = useState<SavedItem | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<PickedImage | null>(null)
  const pickCounter = useRef(0)

  useEffect(() => {
    return () => {
      if (imageRef.current) URL.revokeObjectURL(imageRef.current.previewUrl)
    }
  }, [])

  function replaceImage(next: PickedImage | null) {
    if (imageRef.current) URL.revokeObjectURL(imageRef.current.previewUrl)
    imageRef.current = next
    setImage(next)
  }

  function clearImage() {
    pickCounter.current++
    replaceImage(null)
    setImageError(null)
    setIsPreparing(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function resetAll() {
    form.reset()
    clearImage()
    setSavedItem(null)
  }

  function finish() {
    resetAll()
    setOpen(false)
    router.refresh()
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const pick = ++pickCounter.current
    setImageError(null)
    if (!file) {
      replaceImage(null)
      return
    }
    setIsPreparing(true)
    try {
      const prepared = await prepareImage(file)
      if (pick !== pickCounter.current) return
      replaceImage({
        prepared,
        previewUrl: URL.createObjectURL(prepared.thumb),
      })
    } catch (error) {
      if (pick !== pickCounter.current) return
      replaceImage(null)
      setImageError(
        error instanceof Error ? error.message : "Couldn't read that image."
      )
      if (fileInputRef.current) fileInputRef.current.value = ""
    } finally {
      if (pick === pickCounter.current) setIsPreparing(false)
    }
  }

  async function uploadAndFinish(item: SavedItem) {
    if (image) {
      try {
        await uploadPreparedImage(item.id, image.prepared)
      } catch {
        setSavedItem(item)
        setImageError(
          "The image didn't upload. Check your connection and try again."
        )
        router.refresh()
        return
      }
    }
    finish()
  }

  async function retryUpload() {
    if (!savedItem) return
    setIsRetrying(true)
    setImageError(null)
    await uploadAndFinish(savedItem)
    setIsRetrying(false)
  }

  async function onSubmit(data: ItemFormValues) {
    let item: SavedItem
    try {
      item = await createItem(data)
    } catch {
      form.setError("root", {
        message: "Couldn't save the item. Please try again.",
      })
      return
    }
    await uploadAndFinish(item)
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
        if (!next && (form.formState.isSubmitting || isRetrying)) return
        setOpen(next)
        if (!next) {
          if (savedItem) router.refresh()
          resetAll()
        }
      }}
    >
      <DialogTrigger render={<Button>Create Item</Button>} />
      <DialogContent>
        <form id="create-item-form" onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="-m-(--card-spacing)">
            <CardHeader>
              <CardTitle>Create Item</CardTitle>
            </CardHeader>
            {savedItem ? (
              <CardContent className="space-y-4">
                <p>
                  “{savedItem.name}” was saved, but its image didn’t upload.
                </p>
                {image && (
                  // eslint-disable-next-line @next/next/no-img-element -- blob: URL
                  <img
                    src={image.previewUrl}
                    alt="Image to upload"
                    className="h-24 rounded border object-cover"
                  />
                )}
                {imageError && (
                  <p className="text-sm text-destructive">{imageError}</p>
                )}
              </CardContent>
            ) : (
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
                        required
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
                      <FieldLabel htmlFor="create-item-season">
                        Season
                      </FieldLabel>
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
                <Field data-invalid={!!imageError}>
                  <FieldLabel htmlFor="create-item-image">
                    Image (optional)
                  </FieldLabel>
                  <Input
                    ref={fileInputRef}
                    id="create-item-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onFileChange}
                    className="file:mr-3 file:h-full file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-2 file:text-primary-foreground"
                  />
                  {isPreparing && (
                    <p className="text-sm text-muted-foreground">
                      Preparing image…
                    </p>
                  )}
                  {image && (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element -- blob: URL, can't use next/image */}
                      <img
                        src={image.previewUrl}
                        alt="Selected image preview"
                        className="h-24 rounded border object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={clearImage}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  {imageError && (
                    <p className="text-sm text-destructive">{imageError}</p>
                  )}
                </Field>
              </CardContent>
            )}
            {form.formState.errors.root && (
              <p className="px-6 text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}
            <CardFooter>
              {savedItem ? (
                <Field orientation="horizontal">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={finish}
                    disabled={isRetrying}
                  >
                    Skip image
                  </Button>
                  <Button
                    type="button"
                    onClick={retryUpload}
                    disabled={isRetrying}
                  >
                    {isRetrying ? "Uploading…" : "Retry upload"}
                  </Button>
                </Field>
              ) : (
                <Field orientation="horizontal">
                  <Button type="button" variant="outline" onClick={resetAll}>
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    form="create-item-form"
                    disabled={form.formState.isSubmitting || isPreparing}
                  >
                    Submit
                  </Button>
                </Field>
              )}
            </CardFooter>
          </Card>
        </form>
      </DialogContent>
    </Dialog>
  )
}
