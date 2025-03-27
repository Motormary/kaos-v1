import { createClient } from "@/lib/supabase/server"

export default async function Home() {
  const client = await createClient()
  const auth = await client.auth.getUser()
  if (auth.error)
    return (
      <div className="h-screen w-full p-5">
        <div className="max-w-content m-auto grid h-full">
          <h1 className="m-auto text-3xl">You are not logged in</h1>
        </div>
      </div>
    )

  return (
    <div className="h-screen w-full p-5">
      <div className="max-w-content m-auto grid h-full">
        <h1 className="m-auto text-3xl">Logged in!</h1>
      </div>
    </div>
  )
}
