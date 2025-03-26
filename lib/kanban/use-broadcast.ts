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

const myname = `master-${(1 + Math.random()).toFixed(3)}`
const socket = new WebSocket(
  `ws://192.168.10.132:8000?user=${myname}`,
)

export default function useBroadCast(
  setCols: (data: MessageProps["message"]["drop"]) => void,
  handleActiveRemote: (id: string, action: "add" | "remove") => void,
) {
  const ws = useRef<WebSocket | null>(socket)
  const { open, isMobile } = useSidebar()
  const sidebarOffsetX = isMobile ? 256 : open ? 0 : 208
  const isJackedIn = useRef<boolean>(false)
  const [users, setUsers] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<
    "pending" | "connected" | "closing" | "disconnected"
  >("disconnected")
  const scrollRef = useRef<HTMLElement | null>(null)
  const manualDisconnect = useRef<boolean>(false)

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

  const connectOperator = useCallback(() => {
    isJackedIn.current = true
    manualDisconnect.current = false
    // Check for connection
    if (
      connectionStatus !== "pending" &&
      connectionStatus !== "closing" &&
      connectionStatus !== "connected"
    ) {
      console.info("Creating new WS connection")

      ws.current = new WebSocket(
        `ws://192.168.10.132:8000?user=${myname}`,
      )

      // Force a rerender of users to reset the ws.onmessage
      setUsers((prev) => prev.map((user) => user))
    }
    setTimeout(() => {
      msg({
        type: "connect",
        connect: {
          user: myname,
          connectedAt: new Date(),
        },
      })
    }, 1000)
  }, [connectionStatus, msg])

  const disconnectOperator = useCallback(() => {
    if (ws.current === null) return
    manualDisconnect.current = true
    // Backend will tell all the connected clients to remove current user from their workspace.
    ws.current.close()
    setUsers([])
    checkAndSetStatus()
    isJackedIn.current = false
  }, [checkAndSetStatus, ws])

  const broadcastOperator = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
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
        move: { user: myname, overCol: scrollRef.current?.id },
        x:
          event.clientX + // cursor position inside dnd-container (container is relative)
          (viewPortEl?.scrollLeft ?? 0) +
          (scrollXContainer?.scrollLeft ?? 0) - // adjust for scrollable containers scroll position (this is just a failsafe, they should not be able to scroll X)
          (dndRect?.left ?? 0), // adjust for dnd-containers offset
        y: event.clientY + (viewPortEl?.scrollTop ?? 0) - (dndRect?.top ?? 0),
      })
    },
    [msg, connectOperator],
  )

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
        itemId: event?.active?.id as string,
        overCol: scrollRef.current?.id ?? "",
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
          itemId: event.active.id as string,
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
          itemId: event.active.id as string,
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
        message: {
          type,
          currentUsers,
          start,
          drag,
          drop,
          cancel,
          move,
          sort,
          x,
          y,
        },
      }: MessageProps = JSON.parse(event.data)

      // Check if remote client is already connected
      const isConnected = users?.some(
        (user) => user?.toLowerCase() === remoteClient.toLowerCase(),
      )

      // this a response received by the backend when the user successfully connects to a new socket containing currently connected users.
      if (type === "connected" && currentUsers?.length) {
        setUsers(currentUsers as string[])
      }

      if (type === "connect") {
        if (isConnected) {
          return
        }
        console.info("Connecting user:", remoteClient)
        setUsers((prev) => [...prev, remoteClient])
      }

      if (type === "disconnect") {
        if (isConnected) {
          console.info("disconnecting user:", remoteClient)
          setUsers((prev) => prev.filter((user) => user !== remoteClient))
        }
      }

      if (type === "sort") {
        setCols(sort)
      }

      if (type === "move") {
        moveRemoteOperator(remoteClient, move, x, y)
      }

      if (type === "start") {
        handleActiveRemote(start?.itemId as string, "add")
        startDragRemoteOperator(start)
      }
      if (type === "drag") {
        console.info("drag")
        dragRemoteOperator(drag, x, y, sidebarOffsetX)
      }
      if (type === "cancel") {
        console.info("cancel")
        handleActiveRemote(cancel?.itemId as string, "remove")
        cancelRemoteOperator(cancel)
      }
      if (type === "drop") {
        console.info("drop")
        handleActiveRemote(drop?.itemId as string, "remove")
        dropRemoteOperator(drop, setCols)
        // deployAgent()
      }
    }

    ws.current.onmessage = handleWebsocketMsg

    checkAndSetStatus()

    return () => {}
  }, [users, setCols, checkAndSetStatus, ws, sidebarOffsetX, handleActiveRemote])

  return {
    users, // users in group
    setUsers,
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
