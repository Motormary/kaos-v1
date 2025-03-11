import { ColumnProps } from "@/lib/kanban/types"
import { useDroppable } from "@dnd-kit/core"

export default function DropContainer({
  children,
  data,
  index,
}: {
  children: React.ReactNode
  data: ColumnProps
  index: number
}) {
  const { setNodeRef } = useDroppable({
    id: data.id,
    data: {
      colIndex: index,
      col: data.id,
      type: "drop",
    },
  })

  return (
    <ul
      ref={setNodeRef}
      className="outline-muted-foreground/40 mx-0.5 grid h-screen min-w-[336px] content-start gap-2 rounded-sm p-2 outline"
    >
      {children}
    </ul>
  )
}
