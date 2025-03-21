import { DragCancelEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core"
import throttle from "lodash.throttle"
import { useEffect, useRef, useState } from "react"
import { msg } from "../websocket"
import { latency } from "./data"
import { ColumnProps, MessageProps } from "./types"

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
          connect,
          disconnect,
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
        const mouse = document?.getElementById(remoteClient)
        const scrollYContainer = document.getElementById(
          move?.overCol as string,
        )
        const scrollXContainer = document.querySelector("div.dnd-columns")
        const viewPortEl = scrollYContainer?.children.item(1)

        if (!mouse) return
        const offsetX =
          (x ?? 0) -
          3.5 -
          (viewPortEl?.scrollLeft ?? 0) -
          (scrollXContainer?.scrollLeft ?? 0) // the 3.5px are to adjust for the svg pointer position
        const offsetY = (y ?? 0) - 3.5 - (viewPortEl?.scrollTop ?? 0)
        mouse.style.transition = "top 0ms linear, left 0ms linear"
        mouse.style.left = `${offsetX}px`
        mouse.style.top = `${offsetY}px`
      }

      if (type === "start") {
        if (isDraggingRef.current) return
        isDraggingRef.current = true
        console.info("start")
        const dragEl = document.getElementById(start?.itemId as string)
        if (!dragEl) return
        dragEl.style.pointerEvents = "none"
        const rect = dragEl.getBoundingClientRect()
        const clone = dragEl.cloneNode(true) as HTMLElement
        const dndContainer = document.querySelector("div.dnd-container")
        dndContainer?.appendChild(clone)
        const dndRect = dndContainer?.getBoundingClientRect()
        const offsetX = rect.x - (dndRect?.left ?? 0)
        const offsetY = rect.y - (dndRect?.top ?? 0)
        clone.classList.add("ghost")
        clone.id = `${start?.itemId}-clone`
        clone.style.width = `${rect.width}px`
        clone.style.height = `${rect.height}px`
        clone.style.position = `absolute`
        clone.style.left = `${offsetX}px`
        clone.style.top = `${offsetY}px`
        clone.style.zIndex = "49"
        clone.classList.remove("backdrop-blur-md", "bg-background/40") //? Connected to line:22 @ item.tsx
        clone.classList.add("animate-pop", "bg-background")
        dragEl.classList.add("opacity-50")
      }
      if (type === "drag") {
        console.info("drag")
        const cloneEl = document.getElementById(`${drag?.itemId}-clone`)
        const dragEl = document.getElementById(drag?.itemId as string)
        const dndContainer = document.querySelector("div.dnd-container")
        const dndRect = dndContainer?.getBoundingClientRect()
        const scrollXContainer = document.querySelector("div.dnd-columns")

        if (!cloneEl || !dragEl) return
        const offsetX =
          (x ?? 0) -
          window.scrollX -
          (dndRect?.left ?? 0) -
          (scrollXContainer?.scrollLeft ?? 0)
        const offsetY = (y ?? 0) - window.scrollY - (dndRect?.top ?? 0)
        cloneEl.style.left = `${offsetX}px`
        cloneEl.style.top = `${offsetY}px`
      }
      if (type === "cancel") {
        console.info("cancel")
        const dragEl = document.getElementById(cancel?.itemId as string)
        const cloneEl = document.getElementById(`${cancel?.itemId}-clone`)
        const dndContainer = document.querySelector("div.dnd-container")
        const dndRect = dndContainer?.getBoundingClientRect()
        if (!dragEl || !cloneEl) return
        if (cloneEl) {
          const dragRect = dragEl.getBoundingClientRect()
          cloneEl.style.transition = "top 200ms ease, left 200ms ease"
          cloneEl.style.left = `${dragRect.left - (dndRect?.left ?? 0)}px`
          cloneEl.style.top = `${dragRect.top - (dndRect?.top ?? 0)}px`

          /**
           *? Waits for transition end. Alternative for listening to transitionend, in case transition never occurred.
           */
          setTimeout(() => {
            cloneEl.remove()
            dragEl?.classList.remove("opacity-50")
            dragEl.style.pointerEvents = "auto"

            isDraggingRef.current = false
          }, 200)
        }
      }
      if (type === "drop") {
        console.info("drop")
        const dragEl = document.getElementById(drop?.itemId as string)
        const cloneEl = document.getElementById(`${drop?.itemId}-clone`)
        const dndContainer = document.querySelector("div.dnd-container")
        const dndRect = dndContainer?.getBoundingClientRect()
        if (!dragEl) {
          console.error(
            "Error in (cancel): Missing params => dragEl:",
            drag?.itemId,
          )
          return
        }
        setCols(drop?.newState as ColumnProps[])
        /**
         *? Makes sure column state can rerender
         */
        setTimeout(() => {
          if (cloneEl) {
            const newEl = document.getElementById(drop?.itemId as string)
            const containerEL = document.getElementById(drop?.overCol as string)
            if (!newEl || !containerEL) return
            const newRect = newEl.getBoundingClientRect()
            cloneEl.style.transition = "top 200ms ease, left 200ms ease"
            cloneEl.style.left = `${newRect.left - (dndRect?.left ?? 0)}px`
            cloneEl.style.top = `${newRect.top - (dndRect?.top ?? 0)}px`

            /**
             *? Waits for transition end. Alternative for listening to transitionend, in case transition never occurred.
             */
            setTimeout(() => {
              cloneEl.remove()
              dragEl?.classList.remove("opacity-50")
              dragEl.style.pointerEvents = "auto"

              isDraggingRef.current = false
            }, 200)
          }
        }, 10 + latency)
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

      ws = new WebSocket(
        `ws://192.168.10.132:8000?user=${myname}`,
      )

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
