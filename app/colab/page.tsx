import KanbanBoard from "@/components/dnd/kanban"

export default async function Colab() {
  return (
    <div className="px-10 py-16 outline-2 outline-blue-200">
      <KanbanBoard />
    </div>
  )
}
