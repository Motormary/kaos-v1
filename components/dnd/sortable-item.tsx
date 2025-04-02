import { cn } from "@/lib/utils"
import { DB_Item } from "@/supabase/types"
import {
  AnimateLayoutChanges,
  defaultAnimateLayoutChanges,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { memo } from "react"
import Item from "./item"

const Draggable = ({
  className,
  children,
  data,
  index,
  colIndex,
}: {
  data: DB_Item
  children?: React.ReactNode
  className?: string
  index?: number
  colIndex?: number
}) => {
  const animateLayoutChanges: AnimateLayoutChanges = (args) =>
    defaultAnimateLayoutChanges({ ...args, wasDragging: true })

  const { active, attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: data.item_id,
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
    <Item
      id={`${data.item_id}`}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      draggable={false}
      data={data}
      aria-describedby={`DndDescribeBy-${index}`}
      className={cn(
        className,
        active?.id === data.item_id && "animate-fade-half opacity-50",
        active?.id !== data.item_id &&
          "ring-offset-background ring-primary/40 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      )}
    >
      {children}
    </Item>
  )
}

export default memo(Draggable)
