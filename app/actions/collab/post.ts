"use server"

import { NewCollabSchema } from "@/components/dnd/new-collab-form"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

export async function createCollab(formData: z.infer<typeof NewCollabSchema>) {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) return { success: false, data: null, error: userError }

  const dataWithOwner = { ...formData, owner: userData?.user?.id }

  const { error: insertError } = await supabase
    .from("collabs")
    .insert(dataWithOwner)

  if (insertError) return { success: false, data: null, error: insertError }

  return { success: true, data: null, error: null }
}
