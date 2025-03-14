"use client"
import { ItemProps } from "@/lib/kanban/types"
import { cn } from "@/lib/utils"
import { forwardRef, memo } from "react"
import { Badge } from "../ui/badge"

interface sortableItemProps extends React.HTMLAttributes<HTMLLIElement> {
  data: ItemProps
  active?: boolean
}

const Item = forwardRef<HTMLLIElement, sortableItemProps>(
  ({ className, children, data, active, ...props }, ref) => {
    /*   const getRandomColor = () => {
      const colors = [
        "stroke-red-500",
        "stroke-orange-500",
        "stroke-amber-500",
        "stroke-yellow-500",
        "stroke-lime-500",
        "stroke-green-500",
        "stroke-teal-500",
        "stroke-cyan-500",
        "stroke-blue-500",
        "stroke-indigo-500",
        "stroke-violet-500",
        "stroke-purple-500",
        "stroke-pink-500",
        "stroke-rose-500",
      ]
      return colors[Math.floor(Math.random() * colors.length)]
    } */

    // TODO: TURN DATA ICONS INTO STRING AND GET ICONS HERE
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
          <PriorityBadge prio={data.prio} />
          <div className="flex items-center gap-2 font-semibold">
            <span className="bg-muted-foreground dark:bg-muted rounded-full p-1 outline">
              {data.icon ? (
                <data.icon className={cn("size-4 stroke-emerald-400")} />
              ) : null}
            </span>{" "}
            <p>{data.title}</p>
          </div>
        </div>
        <div className="text-primary pb-5 text-sm">
          <p className="line-clamp-2">{data.body}</p>
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
