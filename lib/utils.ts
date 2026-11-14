export { cn } from "cn"

export function capitalise(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function getPaginationItems(
  currentPage: number,
  totalPages: number
): (number | "ellipsis")[] {
  return Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(
      (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
    )
    .reduce<(number | "ellipsis")[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("ellipsis")
      acc.push(p)
      return acc
    }, [])
}
