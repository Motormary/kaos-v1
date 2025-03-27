import KanbanBoard from "@/components/dnd/kanban"
import { createClient } from "@/lib/supabase/server"

export default async function Colab() {
  const supabase = await createClient()
  const { data: colabs } = await supabase.from("colabs").select()
  console.log(JSON.stringify(colabs, null, 2))
  return (
    <div className="px-4 pt-4 max-sm:pb-16 sm:px-10">
      <KanbanBoard />
    </div>
  )
}
