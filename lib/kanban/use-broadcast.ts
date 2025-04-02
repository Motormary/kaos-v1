import { useSidebar } from "@/components/ui/sidebar"
import { DragCancelEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core"
import throttle from "lodash.throttle"
import { useCallback, useEffect, useRef, useState } from "react"
import { MessageProps } from "./types"
import {
  cancelRemoteOperator,
  dragRemoteOperator,
  dropRemoteOperator,
  moveRemoteOperator,
  startDragRemoteOperator,
} from "./utils"
import { createClient } from "../supabase/client"
import { useParams } from "next/navigation"

// const socket = new WebSocket(`ws://192.168.10.132:8000`)

async function initiateWs() {
  console.log("Initiating websocket")
  const supabase = createClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw new Error("Error fetching session", error)
  }
  return new WebSocket(`ws://192.168.10.132:8000?user=${session?.user.id}`)
}

export default function useBroadCast(
  setCols: (data: MessageProps["message"]["drop"]) => void,
  handleActiveRemote: (id: number, action: "add" | "remove") => void,
) {
  const currentUser = useRef<string>(`guest-${Math.round(Math.random() * 100)}`)
  const params = useParams()
  const ws = useRef<WebSocket | null>(null)
  const { open, isMobile } = useSidebar()
  const sidebarOffsetX = isMobile ? 256 : open ? 0 : 208
  const isJackedIn = useRef<boolean>(false)
  const [connectionStatus, setConnectionStatus] = useState<
    "pending" | "connected" | "closing" | "disconnected"
  >("disconnected")
  const scrollRef = useRef<HTMLElement | null>(null)
  const manualDisconnect = useRef<boolean>(false)

  useEffect(() => {
    if (ws.current) return
    async function start() {
      ws.current = await initiateWs()
    }
    start()
  }, [])

  const reportError = throttle(
    () => console.warn("Message not sent, not connected to websocket."),
    30000,
    {
      trailing: false,
    },
  )

  const msg = useCallback(
    (data: MessageProps["message"]) => {
      if (ws.current === null) return
      if (ws.current && ws.current?.readyState !== 1) {
        reportError()
        return
      } else {
        try {
          const msg = JSON.stringify(data)
          ws.current.send(msg)
        } catch (e) {
          console.warn("Websocket request failed:", e)
        }
      }
    },
    [reportError, ws],
  )

  const checkAndSetStatus = useCallback(() => {
    if (ws.current === null) return
    switch (ws.current.readyState) {
      case 0:
        if (connectionStatus !== "pending") {
          setConnectionStatus("pending")
          setTimeout(() => checkAndSetStatus(), 2000)
        }
        break
      case 1:
        if (connectionStatus !== "connected") {
          setConnectionStatus("connected")
        }
        break
      case 2:
        if (connectionStatus !== "closing") {
          setConnectionStatus("closing")
          setTimeout(() => checkAndSetStatus(), 2000)
        }
        break
      default:
        if (connectionStatus !== "disconnected") {
          setConnectionStatus("disconnected")
        }
        break
    }
  }, [connectionStatus, ws])

  async function connectOperator() {
    isJackedIn.current = true

    manualDisconnect.current = false
    // Check for connection
    if (
      connectionStatus !== "pending" &&
      connectionStatus !== "closing" &&
      connectionStatus !== "connected"
    ) {
      console.info("Creating new WS connection")

      ws.current = await initiateWs()

      ws.current.onopen = async () => {
        console.log("NEW CONNECTION OPEN")
        const supabase = createClient()
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        if (!session?.access_token) {
          ws.current?.close()
          console.error("Error passing auth to websocket", error)
          return
        }
        ws?.current?.send(
          JSON.stringify({
            type: "connect",
            connect: {
              user: session.user.id,
              collab_id: params.collab_id,
              connectedAt: new Date(),
              token: session.access_token,
            },
          }),
        )
      }
      checkAndSetStatus()

      // Force a rerender of users to reset the ws.onmessage
      // setUsers((prev) => prev.map((user) => user))
    }
  }

  async function disconnectOperator() {
    if (ws.current === null) return
    const supabase = createClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      ws.current?.close()
      console.error("Error passing auth to websocket", error)
      return
    }
    msg({
      type: "disconnect",
      disconnect: {
        user: currentUser.current,
        collab_id: params?.collab_id as string,
        token: session.access_token,
      },
    })
    manualDisconnect.current = true
    // Backend will tell all the connected clients to remove current user from their workspace.
    // ws.current.close()
    // setUsers([])
    checkAndSetStatus()
    isJackedIn.current = false
  }

  function broadcastOperator(event: React.PointerEvent<HTMLDivElement>) {
    if (!isJackedIn.current && !manualDisconnect.current) {
      connectOperator()
    }
    const containerEl = document.getElementById(scrollRef.current?.id ?? "")
    const dndEl = document.querySelector("div.dnd-container")
    const scrollXContainer = document.querySelector("div.dnd-columns")
    const dndRect = dndEl?.getBoundingClientRect()
    const viewPortEl = containerEl?.children.item(1)

    msg({
      type: "move",
      move: { user: currentUser.current, overCol: scrollRef.current?.id },
      x:
        event.clientX + // cursor position inside dnd-container (container is relative)
        (viewPortEl?.scrollLeft ?? 0) +
        (scrollXContainer?.scrollLeft ?? 0) - // adjust for scrollable containers scroll position (this is just a failsafe, they should not be able to scroll X)
        (dndRect?.left ?? 0), // adjust for dnd-containers offset
      y: event.clientY + (viewPortEl?.scrollTop ?? 0) - (dndRect?.top ?? 0),
    })
  }

  function broadcastDrag(event: DragMoveEvent) {
    const containerEl = document.getElementById(scrollRef.current?.id ?? "")
    const scrollXContainer = document.querySelector("div.dnd-columns")
    const viewPortEl = containerEl?.children.item(1)

    const offsetX =
      (event.active.rect.current.translated?.left ?? 0) +
      (viewPortEl?.scrollLeft ?? 0) +
      (scrollXContainer?.scrollLeft ?? 0) +
      window.scrollX +
      sidebarOffsetX
    const offsetY =
      (event.active.rect.current.translated?.top ?? 0) +
      (viewPortEl?.scrollTop ?? 0) +
      window.scrollY

    msg({
      type: "drag",
      drag: {
        itemId: event?.active?.id as number,
        overCol: scrollRef?.current?.id ?? "",
      },
      x: offsetX,
      y: offsetY,
    })
  }
  const cancelDragBroadcast = useCallback(
    (event: DragCancelEvent) => {
      msg({
        type: "cancel",
        overCol: event.over?.data.current?.col,
        cancel: {
          itemId: event.active.id as number,
        },
      })
    },
    [msg],
  )

  const endDragBroadcast = useCallback(
    (event: DragCancelEvent, data: MessageProps["message"]["drop"]) => {
      msg({
        type: "drop",
        overCol: event.over?.data?.current?.col,
        drop: data,
      })
    },
    [msg],
  )

  const startBroadcast = useCallback(
    (event: DragStartEvent) => {
      checkAndSetStatus()
      msg({
        type: "start",
        overCol: event.active.data.current?.col,
        start: {
          itemId: event.active.id as number,
        },
      })
    },
    [msg, checkAndSetStatus],
  )

  const broadcastSort = useCallback(
    (data: MessageProps["message"]["sort"]) => {
      msg({
        type: "sort",
        sort: data,
      })
    },
    [msg],
  )

  const setOverRef = useCallback((event: HTMLElement | null) => {
    scrollRef.current = event
  }, [])

  useEffect(() => {
    if (!ws.current) return
    console.log("useEffect")
    const handleWebsocketMsg = (event: MessageEvent) => {
      const {
        remoteClient,
        message: { type, start, drag, drop, cancel, move, sort, x, y },
      }: MessageProps = JSON.parse(event.data)

      // Check if remote client is already connected
      /*  const isConnected = users?.some(
        (user) => user?.toLowerCase() === remoteClient.toLowerCase(),
      ) */

      // this a response received by the backend when the user successfully connects to a new socket containing currently connected users.
      /* if (type === "connected" && currentUsers?.length) {
        setUsers(currentUsers as string[])
      } */

      /*  if (type === "connect") {
        if (isConnected) {
          return
        }
        console.info("Connecting user:", remoteClient)
        setUsers((prev) => [...prev, remoteClient])
      } */

      /*  if (type === "disconnect") {
        if (isConnected) {
          console.info("disconnecting user:", remoteClient)
          setUsers((prev) => prev.filter((user) => user !== remoteClient))
        }
      } */

      if (type === "sort") {
        setCols(sort)
      }

      if (type === "move") {
        moveRemoteOperator(remoteClient, move, x, y)
      }

      if (type === "start") {
        handleActiveRemote(start?.itemId as number, "add")
        startDragRemoteOperator(start)
      }
      if (type === "drag") {
        console.info("drag")
        dragRemoteOperator(drag, x, y, sidebarOffsetX)
      }
      if (type === "cancel") {
        console.info("cancel")
        handleActiveRemote(cancel?.itemId as number, "remove")
        cancelRemoteOperator(cancel)
      }
      if (type === "drop") {
        console.info("drop")
        handleActiveRemote(drop?.itemId as number, "remove")
        dropRemoteOperator(drop, setCols)
        // deployAgent()
      }
    }

    ws.current.onmessage = handleWebsocketMsg
    ws.current.onopen = async () => {
      console.log("CONNECTION OPEN")
      const supabase = createClient()
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (!session?.access_token) {
        ws.current?.close()
        console.error("Error passing auth to websocket", error)
        return
      }
      const username = await (
        await supabase.auth.getUser()
      ).data.user?.user_metadata.display_name
      currentUser.current = username
      ws?.current?.send(
        JSON.stringify({
          type: "connect",
          connect: {
            user: session.user.id,
            collab_id: params.collab_id,
            connectedAt: new Date(),
            token: session.access_token,
          },
        }),
      )
      // ws.current?.send(session.access_token)
    }

    checkAndSetStatus()

    return () => {}
  }, [
    setCols,
    checkAndSetStatus,
    ws,
    sidebarOffsetX,
    handleActiveRemote,
    params,
  ])

  return {
    connectionStatus, // websocket status
    connectOperator, // Connect to websocket
    disconnectOperator,
    broadcastOperator, // Send cursor position
    broadcastDrag,
    cancelDragBroadcast,
    endDragBroadcast,
    startBroadcast,
    setOverRef,
    broadcastSort,
  }
}
