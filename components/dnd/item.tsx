import { ItemProps } from "@/lib/kanban/types"
import { cn } from "@/lib/utils"
import { forwardRef } from "react"
import { Badge } from "../ui/badge"

interface sortableItemProps extends React.HTMLAttributes<HTMLLIElement> {
  data: ItemProps
  active?: boolean
}

export const SortableItem = forwardRef<HTMLLIElement, sortableItemProps>(
  ({ className, children, data, active, ...props }, ref) => {
    return (
      <li
        {...props}
        id={data.id}
        ref={ref}
        aria-describedby={`DndDescribeBy-${data.index}`}
        className={cn(
          className,
          !active && "bg-background/40 backdrop-blur-md", //? Connected to remote start event, don't edit... unless both
          "flex h-52 w-80 list-none flex-col gap-4 overflow-hidden rounded-sm border-3 select-none [&>div]:px-5",
        )}
      >
        <div className="py-2">
          <Badge variant={"destructive"} className="float-right ms-2">
            High prio
          </Badge>
          <p className="font-semibold">{data.title}</p>
        </div>
        <div className="text-primary pb-5 text-sm">
          <p className="line-clamp-2">{data.body}</p>
          {children}
        </div>
      </li>
    )
  },
)

SortableItem.displayName = "SortableItem"
