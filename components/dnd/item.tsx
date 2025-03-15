"use client"
import { ItemProps } from "@/lib/kanban/types"
import { cn } from "@/lib/utils"
import * as lucide from "lucide-react"
import { forwardRef, memo } from "react"
import { Badge } from "../ui/badge"

interface sortableItemProps extends React.HTMLAttributes<HTMLLIElement> {
  data: ItemProps
  active?: boolean
}

const Item = forwardRef<HTMLLIElement, sortableItemProps>(
  ({ className, children, data, active, ...props }, ref) => {
    const LucideIcon = lucide[
      data.icon as keyof typeof lucide
    ] as React.FC<lucide.LucideProps>

    return (
      <li
        {...props}
        id={data.id}
        ref={ref}
        aria-describedby={`DndDescribeBy-${data.index}`}
        className={cn(
          className,
          !active && "bg-background/40 backdrop-blur-md", //? Connected to remote drag-start event, don't edit... unless you edit both
          "flex h-40 w-80 list-none flex-col gap-4 overflow-hidden rounded-sm border-3 select-none [&>div]:px-5",
        )}
      >
        <div className="py-2">
          <PriorityBadge prio={data.prio} />
          <div className="flex items-center gap-2 font-semibold">
            <span className="bg-muted-foreground dark:bg-muted rounded-full p-1 outline">
              {LucideIcon ? (
                <LucideIcon className={cn("size-4 stroke-emerald-400")} />
              ) : null}
            </span>{" "}
            <p>{data.title}</p>
          </div>
        </div>
        <div className="text-primary flex h-full flex-col justify-between pb-5 text-sm">
          <p className="line-clamp-2">{data.body}</p>
          <p className="text-end font-semibold">
            {Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(data.value)}
          </p>
          {children}
        </div>
      </li>
    )
  },
)

Item.displayName = "Item"

export default memo(Item)

function PriorityBadge({ prio }: { prio: number }) {
  const variant =
    prio === 0 ? "outline" : prio === 1 ? "default" : "destructive"
  const text = prio === 0 ? "Low prio" : prio === 1 ? "Mid prio" : "High prio"

  return (
    <Badge variant={variant} className="float-right ms-2">
      {text}
    </Badge>
  )
}
