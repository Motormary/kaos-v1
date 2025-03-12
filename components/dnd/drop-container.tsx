import { ColumnProps } from "@/lib/kanban/types"
import { cn } from "@/lib/utils"
import { useDroppable } from "@dnd-kit/core"
import { ScrollArea, ScrollBar } from "../ui/scroll-area"
import { forwardRef } from "react"
import { ScrollAreaProps } from "@radix-ui/react-scroll-area"

export const DropContainer = forwardRef<
  HTMLDivElement,
  ScrollAreaProps & {
    data: ColumnProps
    index: number
  }
>(({ data, index, children, ...props }, ref) => {
  const { setNodeRef, over } = useDroppable({
    id: data.id,
    data: {
      colIndex: index,
      col: data.id,
      type: "drop",
    },
  })

  return (
    <div>
      <p className="text-primary-foreground text-center text-3xl font-bold">
        {data.id}
      </p>
      <ScrollArea
        id={data.id}
        ref={ref}
        {...props}
        className="h-[85svh] pr-0.5"
      >
        <ul
          id={data.id}
          ref={setNodeRef}
          className={cn(
            "outline-muted-foreground/40 mx-0.5 grid min-h-[85svh] min-w-[336px] content-start gap-2 rounded-sm p-2",
          )}
        >
          {children}
        </ul>
        <ScrollBar id={`scrollbar-${data.id}`} orientation="vertical" />
      </ScrollArea>
    </div>
  )
})
DropContainer.displayName = "DropContainer"
