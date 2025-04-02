import { DB_Column, DB_Item } from "@/supabase/types"
import { arrayMove } from "@dnd-kit/sortable"
import { MessageProps } from "./types"

export function addToCol(
  col: DB_Column & { items: DB_Item[] },
  item: DB_Item | null,
): DB_Column & { items: DB_Item[] } {
  if (!item || !col) {
    throw new Error("Error adding item to column, params missing")
  }

  return {
    ...col,
    items: [
      ...col.items,
      { ...item, column_id: col.column_id, index: col.items.length } as DB_Item,
    ],
  }
}

export function removeFromCol(
  col: DB_Column & { items: DB_Item[] },
  activeId: number,
): DB_Column & { items: DB_Item[] } {
  if (typeof activeId !== "number" || !col) {
    throw new Error("Error removing item from column, params missing")
  }

  const filteredCol = {
    ...col,
    items: col.items
      .filter((item) => item.item_id !== activeId)
      .map((item, index) => ({ ...item, index })),
  }

  return filteredCol
}

export function reorderItems(
  items: DB_Item[],
  activeIndex: number,
  overIndex: number,
): DB_Item[] {
  if (
    !items?.length ||
    typeof activeIndex !== "number" ||
    typeof overIndex !== "number"
  ) {
    throw new Error("Error reordering items, params missing")
  }

  const sortedArray = arrayMove(items, activeIndex, overIndex)

  const updatedArray = sortedArray.map((item, index) => ({
    ...item,
    index,
  }))

  return updatedArray
}

export function moveRemoteOperator(
  remoteClient: string,
  move: MessageProps["message"]["move"],
  x: number | undefined,
  y: number | undefined,
) {
  const mouse = document?.getElementById(remoteClient)
  const scrollYContainer = document.getElementById(move?.overCol as string)
  const scrollXContainer = document.querySelector("div.dnd-columns")
  const viewPortEl = scrollYContainer?.children.item(1)

  if (!mouse) return
  const offsetX =
    (x ?? 0) -
    3.5 -
    (viewPortEl?.scrollLeft ?? 0) -
    (scrollXContainer?.scrollLeft ?? 0) // the 3.5px are to adjust for the svg pointer position
  const offsetY = (y ?? 0) - 3.5 - (viewPortEl?.scrollTop ?? 0)
  mouse.style.transition = "top 0ms linear, left 0ms linear"
  mouse.style.left = `${offsetX}px`
  mouse.style.top = `${offsetY}px`
}

export function startDragRemoteOperator(
  start: MessageProps["message"]["start"],
) {
  console.info("start")
  const dragEl = document.getElementById(`${start?.itemId}`)
  if (!dragEl) return
  const rect = dragEl.getBoundingClientRect()
  const clone = dragEl.cloneNode(true) as HTMLElement
  const dndContainer = document.querySelector("div.dnd-container")
  dndContainer?.appendChild(clone)
  const dndRect = dndContainer?.getBoundingClientRect()
  const offsetX = rect.x - (dndRect?.left ?? 0)
  const offsetY = rect.y - (dndRect?.top ?? 0)
  clone.classList.add("ghost")
  clone.id = `${start?.itemId}-clone`
  clone.style.width = `${rect.width}px`
  clone.style.height = `${rect.height}px`
  clone.style.position = `absolute`
  clone.style.left = `${offsetX}px`
  clone.style.top = `${offsetY}px`
  clone.style.zIndex = "49"
  clone.classList.remove("backdrop-blur-md", "bg-background/40") //? Connected to line:22 @ item.tsx
  clone.classList.add("animate-pop", "bg-background")
}

export function dragRemoteOperator(
  drag: MessageProps["message"]["drag"],
  x: number | undefined,
  y: number | undefined,
  sidebarOffset: number,
) {
  const cloneEl = document.getElementById(`${drag?.itemId}-clone`)
  const dragEl = document.getElementById(`${drag?.itemId}`)
  const dndContainer = document.querySelector("div.dnd-container")
  const dndRect = dndContainer?.getBoundingClientRect()
  const scrollXContainer = document.querySelector("div.dnd-columns")

  if (!cloneEl || !dragEl) return
  const offsetX =
    (x ?? 0) -
    window.scrollX -
    (dndRect?.left ?? 0) -
    (scrollXContainer?.scrollLeft ?? 0) -
    sidebarOffset
  const offsetY = (y ?? 0) - window.scrollY - (dndRect?.top ?? 0)
  cloneEl.style.left = `${offsetX}px`
  cloneEl.style.top = `${offsetY}px`
}

export function cancelRemoteOperator(
  cancel: MessageProps["message"]["cancel"],
) {
  const dragEl = document.getElementById(`${cancel?.itemId}`)
  const cloneEl = document.getElementById(`${cancel?.itemId}-clone`)
  const dndContainer = document.querySelector("div.dnd-container")
  const dndRect = dndContainer?.getBoundingClientRect()
  if (!dragEl || !cloneEl) return
  if (cloneEl) {
    const dragRect = dragEl.getBoundingClientRect()
    cloneEl.style.transition = "top 200ms ease, left 200ms ease"
    cloneEl.style.left = `${dragRect.left - (dndRect?.left ?? 0)}px`
    cloneEl.style.top = `${dragRect.top - (dndRect?.top ?? 0)}px`

    /**
     *? Waits for transition end. Alternative for listening to transitionend, in case transition never occurred.
     */
    cloneEl.remove()
    dragEl?.classList.remove("opacity-50")
  }
}

export function dropRemoteOperator(
  drop: MessageProps["message"]["drop"],
  setCols: (data: MessageProps["message"]["drop"]) => void,
) {
  const dragEl = document.getElementById(`${drop?.itemId}`)
  const cloneEl = document.getElementById(`${drop?.itemId}-clone`)
  const dndContainer = document.querySelector("div.dnd-container")
  const dndRect = dndContainer?.getBoundingClientRect()
  if (!dragEl) {
    console.error("Error in (cancel): Missing params => dragEl:", drop?.itemId)
    return
  }
  setCols({ ...drop } as MessageProps["message"]["drop"])
  /**
   *? Makes sure column state can rerender
   */

  setTimeout(() => {
    if (cloneEl) {
      const newEl = document.getElementById(`${drop?.itemId}`)
      const containerEL = document.getElementById(`${drop?.newCol}`)
      if (!newEl || !containerEL) return
      const newRect = newEl.getBoundingClientRect()
      cloneEl.style.transition = "top 200ms ease, left 200ms ease"
      cloneEl.style.left = `${newRect.left - (dndRect?.left ?? 0)}px`
      cloneEl.style.top = `${newRect.top - (dndRect?.top ?? 0)}px`

      /**
       *? Waits for transition end. Alternative for listening to transitionend, in case transition never occurred.
       */
      setTimeout(() => {
        cloneEl.remove()
        dragEl?.classList.remove("opacity-50")
      }, 200)
    }
  }, 10)
}
