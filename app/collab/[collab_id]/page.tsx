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
    .match({ collab_id: data?.[0]?.collab_id })

  if (error) {
    console.error(error)
    throw new Error("Error fetching collabs", error)
  }
  console.log(JSON.stringify(usersData, null, 2))
  console.log(JSON.stringify(data, null, 2))
  return (
    <div className="px-4 pt-4 max-sm:pb-16 sm:px-10">
      <KanbanBoard />
    </div>
  )
}
