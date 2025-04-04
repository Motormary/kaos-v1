"use client"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { PointerEventHandler } from "react"

export default function Collabs() {
  const supabase = createClient()
  const channel = supabase.channel("room_1")

  const MOUSE_EVENT = "cursor"
  channel
    .on("broadcast", { event: MOUSE_EVENT }, ({ payload }) => {
      console.log(payload)
    })
    .subscribe()
  // const { data: userData, error: userError } = await supabase.auth.getUser()
  /*   const { data, error } = await supabase.from("collabs").select()

  if (error) {
    console.error(error)
    throw new Error("Error fetching collabs", error)
  }
  console.log(JSON.stringify(data, null, 2)) */

  function send() {
    channel.send({
      type: "broadcast",
      event: MOUSE_EVENT,
      payload: { user: "hallo" },
    })
  }

  return (
    <div
      className="flex flex-col gap-4 bg-pink-100 px-4 pt-4 max-sm:pb-16 sm:px-10"
      onPointerMove={send}
    ></div>
  )
}
