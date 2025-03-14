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
  const { setNodeRef, active } = useDroppable({
    id: data.id,
    data: {
      colIndex: index,
      col: data.id,
      type: "drop",
    },
  })

  return (
    <div className="border">
      <p className="text-primary bg-muted/50 p-2.5 text-center text-3xl font-bold">
        {data.id}
      </p>
      <ScrollArea
        id={data.id}
        ref={ref}
        {...props}
        className="h-[85svh] px-0.5"
      >
        <ul
          id={data.id}
          ref={setNodeRef}
          className={cn(
            active?.data.current?.col === data.id &&
              "bg-muted/10 dark:bg-muted/20",
            "grid min-h-[85svh] min-w-[336px] content-start gap-2 p-2 transition-colors",
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
