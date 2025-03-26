import KanbanBoard from "@/components/dnd/kanban"

export default async function Colab() {
  return (
    <div className="px-4 pt-4 max-sm:pb-16 sm:px-10">
      <KanbanBoard />
    </div>
  )
}
