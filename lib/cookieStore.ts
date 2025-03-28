"use server"

import { CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function setCookie(key: string, value: string, options: CookieOptions) {
  console.log("🚀 ~ setCookie ~ value:", value)
  console.log("🚀 ~ setCookie ~ key:", key)
  const cookieStore = await cookies()
  cookieStore.set(key, value, options)
}

export async function getCookie(key: string) {
  const cookieStore = await cookies()

  return cookieStore.get(key)?.value
}