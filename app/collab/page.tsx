import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function Collabs() {
  const supabase = await createClient()
  // const { data: userData, error: userError } = await supabase.auth.getUser()
  const { data, error } = await supabase.from("collabs").select()

  if (error) {
    console.error(error)
    throw new Error("Error fetching collabs", error)
  }
  console.log(JSON.stringify(data, null, 2))
  return (
    <div className="flex flex-col gap-4 px-4 pt-4 max-sm:pb-16 sm:px-10">
      {data.map((collab) => (
        <Link href={"collab/" + collab.collab_id} key={collab.collab_id}>
          {collab.collab_id} - {collab.title}
        </Link>
      ))}
    </div>
  )
}
