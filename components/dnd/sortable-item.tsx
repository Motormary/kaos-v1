import { ItemProps } from "@/lib/kanban/types"
import { cn } from "@/lib/utils"
import {
  AnimateLayoutChanges,
  defaultAnimateLayoutChanges,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { memo } from "react"
import { SortableItem } from "./item"

const Draggable = ({
  className,
  children,
  data,
  index,
  colIndex,
}: {
  data: ItemProps
  children?: React.ReactNode
  className?: string
  index?: number
  colIndex?: number
}) => {
  const animateLayoutChanges: AnimateLayoutChanges = (args) =>
    defaultAnimateLayoutChanges({ ...args, wasDragging: true })

  const { active, attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: data.id,
      data: {
        ...data,
        index,
        type: "item",
        colIndex,
      },
      animateLayoutChanges,
    })
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <SortableItem
      id={data.id}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      data={data}
      aria-describedby={`DndDescribeBy-${index}`}
      className={cn(
        className,
        active?.id === data.id && "animate-fade-half opacity-50",
        active?.id !== data.id &&
          "ring-offset-background ring-primary/40 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      )}
    >
      {children}
    </SortableItem>
  )
}

export default memo(Draggable)
