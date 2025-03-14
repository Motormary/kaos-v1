import KanbanBoard from "@/components/dnd/kanban"

export default async function Colab() {
  return (
    <div className="px-10 pt-4 max-sm:pb-16">
      <KanbanBoard />
    </div>
  )
}
