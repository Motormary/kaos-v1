import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function Home() {
  const client = await createClient()
  const auth = await client.auth.getUser()
  if (auth.error) return redirect("/login")

  return (
    <div className="p-5">
      <div className="max-w-content m-auto grid h-full">
        <h1 className="m-auto text-3xl">Logged in!</h1>
      </div>
    </div>
  )
}
