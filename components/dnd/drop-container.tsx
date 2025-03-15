import { ColumnProps } from "@/lib/kanban/types"
import { cn } from "@/lib/utils"
import { useDroppable } from "@dnd-kit/core"
import { ScrollArea, ScrollBar } from "../ui/scroll-area"
import { forwardRef } from "react"
import { ScrollAreaProps } from "@radix-ui/react-scroll-area"
import { Button } from "../ui/button"
import { Plus } from "lucide-react"

export const DropContainer = forwardRef<
  HTMLDivElement,
  ScrollAreaProps & {
    data: ColumnProps
    index: number
    handleAddItem: (columnId: string) => void
  }
>(({ data, index, children, handleAddItem, ...props }, ref) => {
  const { setNodeRef, active } = useDroppable({
    id: data.id,
    data: {
      colIndex: index,
      col: data.id,
      type: "drop",
    },
  })

  return (
    <div className="border" draggable={false}>
      <div className="bg-muted/50 p-2.5 select-none">
        <Button
          variant="ghost"
          onClick={() => handleAddItem(data.id)}
          className="float-right mt-0.5 h-fit cursor-pointer p-2"
        >
          <Plus />
        </Button>
        <p className="text-primary mx-auto w-fit text-3xl font-bold">
          {data.id}
        </p>
      </div>
      <ScrollArea
        id={data.id}
        ref={ref}
        {...props}
        className="h-[85svh] px-0.5"
      >
        <ul
          draggable={false}
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
