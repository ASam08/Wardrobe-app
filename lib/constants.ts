export const COLOURS = {
  Black: "#000000",
  White: "#FFFFFF",
  Navy: "#000080",
  Red: "#FF0000",
  Green: "#008000",
  Blue: "#0000FF",
  Yellow: "#FFFF00",
  Purple: "#800080",
  Pink: "#FFC0CB",
  Gray: "#808080",
  Brown: "#8B4513",
  Orange: "#FFA500",
  Beige: "#F5F5DC",
  Mustard: "#E1AD01",
} as const

export type ColourName = keyof typeof COLOURS
export const COLOUR_NAMES = Object.keys(COLOURS) as [
  ColourName,
  ...ColourName[],
]

export const NEW_CATEGORY = "NEW_CATEGORY"
