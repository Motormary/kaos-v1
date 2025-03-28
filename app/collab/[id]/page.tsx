import KanbanBoard from "@/components/dnd/kanban"
import { createClient } from "@/lib/supabase/server"

type props = {
  params: Promise<{ id: string }>
}

export default async function Colab({ params }: props) {
  const id = (await params).id
  const supabase = await createClient()
  const { data, error } = await supabase.from("colabs").select().match({
    colab_id: id,
  })
  if (error) {
    console.error(error)
    throw new Error("Error fetching collabs", error)
  }
  console.log(JSON.stringify(data, null, 2))
  return (
    <div className="px-4 pt-4 max-sm:pb-16 sm:px-10">
      <KanbanBoard />
    </div>
  )
}
