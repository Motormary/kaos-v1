import { arrayMove } from "@dnd-kit/sortable"
import { ColumnProps, ItemProps } from "./types"

export function addToCol(
  col: ColumnProps,
  item: ItemProps | null,
): ColumnProps {
  if (!item || !col) {
    throw new Error("Error adding item to column, params missing")
  }

  return {
    ...col,
    items: [
      ...col.items,
      { ...item, col: col.id, index: col.items.length } as ItemProps,
    ],
  }
}

export function removeFromCol(col: ColumnProps, activeId: string): ColumnProps {
  if (typeof activeId !== "string" || !col) {
    throw new Error("Error removing item from column, params missing")
  }

  return {
    ...col,
    items: col.items.filter((item) => item.id !== activeId),
  }
}

export function reorderItems(
  items: ItemProps[],
  activeIndex: number,
  overIndex: number,
): ItemProps[] {
  if (
    !items?.length ||
    typeof activeIndex !== "number" ||
    typeof overIndex !== "number"
  ) {
    throw new Error("Error reordering items, params missing")
  }

  const sortedArray = arrayMove(items, activeIndex, overIndex)

  sortedArray.forEach((i, index) => {
    i.index = index
  })

  return sortedArray
}
