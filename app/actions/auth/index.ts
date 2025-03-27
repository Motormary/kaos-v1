"use server"

import { LoginSchema, RegisterSchema } from "@/lib/auth/schemas"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

export async function login(data: z.infer<typeof LoginSchema>) {
  console.log("🚀 ~ login ~ data:", data)
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error("error logging in", error)
    redirect("/error")
  }

  console.info("successfully logged in")
  revalidatePath("/", "layout")
  redirect("/")
}

export async function signup(data: z.infer<typeof RegisterSchema>) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    console.log("🚀 ~ signup ~ error:", error)
    redirect("/error")
  }

  revalidatePath("/", "layout")
  redirect("/")
}
