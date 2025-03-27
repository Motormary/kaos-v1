import { redirect } from "next/navigation"
import { createClient } from "./client"

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error("Error signing out:", error)
  redirect("/")
}
