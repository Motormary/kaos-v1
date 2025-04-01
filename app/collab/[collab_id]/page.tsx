import KanbanBoard from "@/components/dnd/kanban"
import { createClient } from "@/lib/supabase/server"

type props = {
  params: Promise<{ collab_id: string }>
}

export default async function Collab({ params }: props) {
  const collab_id = (await params).collab_id
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("collabs")
    .select()
    .match({ collab_id })

  const { data: usersData, error: userError } = await supabase
    .from("collab_users")
    .select("username")
    .match({ collab_id })

  const { data: colData, error: colError } = await supabase
    .from("collab_column")
    .select()
    .match({ collab_id })

  if (error) {
    console.error(error)
    throw new Error("Error fetching collabs", error)
  }
  console.log("cols:", JSON.stringify(colData, null, 2))
  console.log("users:", JSON.stringify(usersData, null, 2))
  console.log("collab:", JSON.stringify(data, null, 2))
  return (
    <div className="px-4 pt-4 max-sm:pb-16 sm:px-10">
      <KanbanBoard />
    </div>
  )
}
