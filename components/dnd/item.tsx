import { ItemProps } from "@/lib/kanban/types"
import { cn } from "@/lib/utils"
import { Circle } from "lucide-react"
import Image from "next/image"
import { forwardRef } from "react"

interface sortableItemProps extends React.HTMLAttributes<HTMLLIElement> {
  data: ItemProps
}

export const SortableItem = forwardRef<HTMLLIElement, sortableItemProps>(
  ({ className, children, data, ...props }, ref) => {
    const image =
      data.url ||
      "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWltYWdlIj48cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHg9IjMiIHk9IjMiIHJ4PSIyIiByeT0iMiIvPjxjaXJjbGUgY3g9IjkiIGN5PSI5IiByPSIyIi8+PHBhdGggZD0ibTIxIDE1LTMuMDg2LTMuMDg2YTIgMiAwIDAgMC0yLjgyOCAwTDYgMjEiLz48L3N2Zz4="

    return (
      <li
        {...props}
        id={data.id}
        ref={ref}
        aria-describedby={`DndDescribeBy-${data.index}`}
        className={cn(
          className,
          "bg-background flex h-52 w-80 list-none flex-col gap-4 rounded-sm border-2 select-none [&>div]:px-5",
        )}
      >
        <Image
          src={image}
          alt={data.title}
          width={360}
          height={80}
          className={cn(
            !data?.url ? `mx-auto object-center` : "object-cover",
            `bg-muted text- h-20 text-transparent`,
          )}
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
          placeholder="blur"
        />
        <div>
          <Circle
            className={cn(
              data.index === 1
                ? "fill-sky-500"
                : data.index === 2
                  ? "fill-orange-500"
                  : "fill-red-600",
              "float-end ms-2 size-4 stroke-none stroke-1",
            )}
          />
          <p className="font-semibold">{data.title}</p>
        </div>
        <div className="text-muted-foreground pb-5 text-sm">
          <p className="line-clamp-2">{data.body}</p>
          {children}
        </div>
      </li>
    )
  },
)

SortableItem.displayName = "SortableItem"
