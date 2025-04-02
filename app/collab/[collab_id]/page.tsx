import KanbanBoard from "@/components/dnd/kanban"
import { createClient } from "@/lib/supabase/server"
import { DB_Column, DB_Item, DB_User } from "@/supabase/types"

type props = {
  params: Promise<{ collab_id: string }>
}

export default async function Collab({ params }: props) {
  const collab_id = (await params).collab_id
  const supabase = await createClient()

  const { data: users, error: userError } = await supabase
    .from("collab_users")
    .select("username")
    .match({ collab_id })
    .overrideTypes<DB_User[]>()

  const { data: columns, error: colError } = await supabase
    .from("collab_column")
    .select()
    .match({ collab_id })
    .overrideTypes<DB_Column[]>()

  const { data: items, error: itemsError } = await supabase
    .from("collab_column")
    .select()
    .match({ collab_id })
    .overrideTypes<DB_Item[]>()

  if (userError || colError || itemsError) {
    console.error(userError || colError || itemsError)
    throw new Error("woopsie doopsie")
  }

  return (
    <div className="px-4 pt-4 max-sm:pb-16 sm:px-10">
      <KanbanBoard columns={columns} items={items} users={users} />
    </div>
  )
}
