import { cn } from "@/lib/utils"
import { DB_Column } from "@/supabase/types"
import { useDroppable } from "@dnd-kit/core"
import { ScrollAreaProps } from "@radix-ui/react-scroll-area"
import { Plus } from "lucide-react"
import { forwardRef, memo } from "react"
import { Button } from "../ui/button"
import { ScrollArea, ScrollBar } from "../ui/scroll-area"

const DropContainer = forwardRef<
  HTMLDivElement,
  ScrollAreaProps & {
    data: DB_Column
    index: number
    // handleAddItem: (columnId: string) => void
    value: number
    setOverRef: (target: null) => void
  }
>(({ data, index, children, value, setOverRef, ...props }, ref) => {
  const { setNodeRef } = useDroppable({
    id: data.column_id,
    data: {
      colIndex: index,
      col: data.column_id,
      type: "drop",
    },
  })

  return (
    <div className="border" draggable={false}>
      <div
        onPointerEnter={() => setOverRef(null)}
        className="bg-muted/50 space-y-2 p-2.5 select-none"
      >
        <Button
          variant="ghost"
          // onClick={() => handleAddItem(data.id)}
          className="float-right mt-0.5 h-fit cursor-pointer p-2"
        >
          <Plus />
        </Button>
        <p className="text-primary mx-auto w-fit text-3xl font-bold">
          {data.title}
        </p>
        <p className="text-muted-foreground text-center text-sm">
          {Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(value)}
        </p>
      </div>
      <ScrollArea
        id={`${data.column_id}`}
        ref={ref}
        {...props}
        className="h-[76svh] px-0.5"
      >
        <ul
          draggable={false}
          id={`${data.column_id}`}
          ref={setNodeRef}
          className={cn(
            // active?.data.current?.col === data.id &&
            //   "bg-muted/10 dark:bg-muted/20",
            "grid min-h-[76svh] min-w-[336px] content-start gap-2 p-2 transition-colors",
          )}
        >
          {children}
        </ul>
        <ScrollBar id={`scrollbar-${data.column_id}`} orientation="vertical" />
      </ScrollArea>
    </div>
  )
})
DropContainer.displayName = "DropContainer"

export default memo(DropContainer)
