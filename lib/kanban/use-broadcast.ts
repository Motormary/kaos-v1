import { DragCancelEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core"
import throttle from "lodash.throttle"
import { useEffect, useRef, useState } from "react"
import { msg } from "../websocket"
import { latency } from "./data"
import { ColumnProps, MessageProps } from "./types"
import {
  startDragRemoteOperator,
  moveRemoteOperator,
  dragRemoteOprator,
  cancelRemoteOperator,
  dropRemoteOperator,
} from "./utils"

const myname = `master-${(1 + Math.random()).toFixed(3)}`

export let ws: WebSocket | null = new WebSocket(
  `ws://192.168.10.132:8000?user=${myname}`,
)

export default function useBroadCast(setCols: (val: ColumnProps[]) => void) {
  const [users, setUsers] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<
    "pending" | "connected" | "closing" | "disconnected"
  >("disconnected")
  const mainRef = useRef<HTMLElement | null>(null)
  const scrollRef = useRef<HTMLElement | null>(null)
  const isDraggingRef = useRef<true | false>(false)

  useEffect(() => {
    mainRef.current = document.querySelector("main")

    if (ws === null) return
    switch (ws.readyState) {
      case 0:
        setConnectionStatus("pending")
        break
      case 1:
        setConnectionStatus("connected")
        break
      case 2:
        setConnectionStatus("closing")
        break
      default:
        setConnectionStatus("disconnected")
        break
    }

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
          newState,
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

      if (type === "newState" && newState) {
        setCols(newState)
      }

      if (type === "move") {
        moveRemoteOperator(remoteClient, move, x, y)
      }

      if (type === "start") {
        startDragRemoteOperator(isDraggingRef, start)
      }
      if (type === "drag") {
        console.info("drag")
        dragRemoteOprator(drag, x, y)
      }
      if (type === "cancel") {
        console.info("cancel")
        cancelRemoteOperator(cancel, isDraggingRef)
      }
      if (type === "drop") {
        console.info("drop")
        dropRemoteOperator(drop, setCols, isDraggingRef)
        // deployAgent()
      }
    }

    ws.onmessage = handleWebsocketMsg

    return () => {}
  }, [users, setCols])

  let attempt = 0
  // Will check connection status after a second pause
  function reCheckStatus() {
    if (attempt >= 10) {
      checkAndSetStatus()
      attempt = 0
      return
    }
    setTimeout(() => {
      checkAndSetStatus()
      attempt++
    }, 1000)
  }

  function checkAndSetStatus() {
    if (ws === null) return
    switch (ws.readyState) {
      case 0:
        if (connectionStatus !== "pending") {
          setConnectionStatus("pending")
          reCheckStatus()
        }
        break
      case 1:
        if (connectionStatus !== "connected") {
          setConnectionStatus("connected")
          attempt = 0
        }
        break
      case 2:
        if (connectionStatus !== "closing") {
          setConnectionStatus("closing")
          reCheckStatus()
        }
        break
      default:
        if (connectionStatus !== "disconnected") {
          setConnectionStatus("disconnected")
          attempt = 0
        }
        break
    }
  }

  function connectOperator() {
    // Check for connection
    if (
      connectionStatus !== "pending" &&
      connectionStatus !== "closing" &&
      connectionStatus !== "connected"
    ) {
      console.info("Creating new WS connection")

      ws = new WebSocket(`ws://192.168.10.132:8000?user=${myname}`)

      // Force a rerender of users to reset the ws.onmessage
      setUsers((prev) => prev.map((user) => user))
      checkAndSetStatus()
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
  }

  function disconnectOperator() {
    if (ws === null) return
    // Backend will tell all the connected clients to remove current user from their workspace.
    ws.close()
    setUsers([])
    checkAndSetStatus()
  }

  const broadcastOperator = throttle(
    (event: React.PointerEvent<HTMLDivElement>) => {
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
    latency,
    {
      trailing: false,
    },
  )

  const broadcastDrag = throttle(
    (event: DragMoveEvent) => {
      const containerEl = document.getElementById(scrollRef.current?.id ?? "")
      const scrollXContainer = document.querySelector("div.dnd-columns")
      const viewPortEl = containerEl?.children.item(1)
      msg({
        type: "drag",
        drag: {
          itemId: event?.active?.id as string,
          overCol: scrollRef.current?.id ?? "",
        },
        x:
          (event.active.rect.current.translated?.left ?? 0) +
          (viewPortEl?.scrollLeft ?? 0) +
          (scrollXContainer?.scrollLeft ?? 0) +
          window.scrollX,
        y:
          (event.active.rect.current.translated?.top ?? 0) +
          (viewPortEl?.scrollTop ?? 0) +
          window.scrollY,
      })
    },
    latency,
    {
      trailing: false,
    },
  )

  const cancelDragBroadcast = throttle(
    (event: DragCancelEvent) => {
      msg({
        type: "cancel",
        overCol: event.over?.data.current?.col,
        cancel: {
          itemId: event.active.id as string,
        },
      })
    },
    latency,
    {
      trailing: false,
    },
  )

  const endDragBroadcast = throttle(
    (event: DragCancelEvent, newState: ColumnProps[]) => {
      msg({
        type: "drop",
        overCol: event.over?.data?.current?.col,
        drop: {
          itemId: event.active.id as string,
          newState: newState,
          overCol: scrollRef.current?.id ?? "",
        },
      })
    },
    latency,
    {
      trailing: false,
    },
  )

  const startBroadcast = throttle(
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
    latency,
    {
      trailing: false,
    },
  )

  const broadcastNewState = throttle(
    (cols: ColumnProps[]) => {
      msg({
        type: "newState",
        newState: cols,
      })
    },
    latency,
    {
      trailing: false,
    },
  )

  function setOverRef(event: HTMLElement | null) {
    scrollRef.current = event
  }

  /**
   * Assign to pointerup on dnd-container, in case of clone bugs
   */
  let timeout: NodeJS.Timeout
  function deployAgent() {
    clearTimeout(timeout)
    const clones = document.querySelectorAll(".ghost")

    timeout = setTimeout(() => {
      clones.forEach((clone) => clone.remove())
    }, 3000)
  }

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
    deployAgent, // remote drag-image cleaner
    setOverRef,
    broadcastNewState,
  }
}
