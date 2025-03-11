import { useEffect, useState } from "react"
import { msg } from "../websocket"
import { ColumnProps, MessageProps } from "./types"
import throttle from "lodash.throttle"
import { latency } from "./data"
import { DragCancelEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core"

export let ws: WebSocket | null = null

const myname = `master-${(1 + Math.random()).toFixed(3)}`

export default function useBroadCast(setCols: (val: ColumnProps[]) => void) {
  const [users, setUsers] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<
    "pending" | "connected" | "closing" | "disconnected"
  >("disconnected")

  useEffect(() => {
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
          currentUsers,
          type,
          connect,
          disconnect,
          start,
          drag,
          drop,
          cancel,
          move,
          x,
          y,
        },
      }: MessageProps = JSON.parse(event.data)

      const isConnected = users?.some(
        (user) => user?.toLowerCase() === remoteClient.toLowerCase(),
      )

      if (type === "connected" && currentUsers?.length) {
        setUsers(currentUsers as string[])
      }
      if (type === "connect") {
        if (isConnected) {
          return
        }
        console.info("Connecting user:", remoteClient)
        setUsers((prev) => [...prev, connect?.user as string])
      }

      if (type === "disconnect") {
        if (
          users?.some(
            (user) => user?.toLowerCase() === remoteClient.toLowerCase(),
          )
        ) {
          console.log("disconnecting user:", remoteClient)
          setUsers((prev) => prev.filter((user) => user !== remoteClient))
        }
      }

      if (type === "move") {
        const mouse = document?.getElementById(remoteClient)
        if (mouse) {
          const offsetX = (x ?? 0) - 3.5
          const offsetY = (y ?? 0) - 3.5
          mouse.style.transition = "top 0ms linear, left 0ms linear"
          mouse.style.left = `${offsetX}px`
          mouse.style.top = `${offsetY}px`
        }
      }

      if (type === "start") {
        console.log("start")
        const dragEl = document.getElementById(start?.itemId as string)
        const isClone = document.getElementById(`${start?.itemId}-clone`)
        if (!dragEl) {
          console.error(
            "Error in (drag): Missing params => id:",
            start?.itemId,
            "x:",
            x,
            "y:",
            y,
          )
          return
        }
        if (isClone) {
          isClone.remove()
        }
        const rect = dragEl.getBoundingClientRect()
        const clone = dragEl.cloneNode(true) as HTMLElement
        dragEl.before(clone)
        clone.classList.add("ghost")
        clone.id = `${start?.itemId}-clone`
        clone.style.width = `${rect.width}px`
        clone.style.height = `${rect.height}px`
        clone.style.position = `absolute`
        clone.style.left = `${dragEl.offsetLeft}px`
        clone.style.top = `${dragEl.offsetTop}px`
        clone.style.zIndex = "49"
        // clone.style.transition = "scale 100ms ease"
        // clone.style.scale = "1.05"
        clone.classList.add("shadow-xl", "animate-pop")
        clone.style.pointerEvents = "none"
        dragEl.classList.add("opacity-50")
      }
      if (type === "drag") {
        console.log("drag")
        const cloneEl = document.getElementById(`${drag?.itemId}-clone`)
        const dragEl = document.getElementById(drag?.itemId as string)
        if (!cloneEl || !dragEl) return
        const rect = dragEl.getBoundingClientRect()
        const offsetX = rect.left + (x ?? 0)
        const offsetY = rect.top + (y ?? 0)
        cloneEl.style.left = `${offsetX}px` //! + (container).scrollX
        cloneEl.style.top = `${offsetY + window.scrollY}px`
      }
      if (type === "cancel") {
        console.log("cancel")
        const dragEl = document.getElementById(cancel?.itemId as string)
        const cloneEl = document.getElementById(`${cancel?.itemId}-clone`)
        if (!dragEl || !cloneEl) {
          console.error(
            "Error in (cancel): Missing params => dragEl:",
            drag?.itemId,
          )
        }
        if (cloneEl) {
          cloneEl.style.transition = "top 200ms ease, left 200ms ease"
          cloneEl.style.left = `${dragEl?.offsetLeft}px`
          cloneEl.style.top = `${dragEl?.offsetTop}px`

          // Waits for transition end. Alternative for listening to transitionend, in case transition never occured.

          setTimeout(() => {
            cloneEl.remove()
            dragEl?.classList.remove("opacity-50")
          }, 200)
        }
      }
      if (type === "drop") {
        console.log("drop")
        const dragEl = document.getElementById(drop?.itemId as string)
        const cloneEl = document.getElementById(`${drop?.itemId}-clone`)
        if (!dragEl) {
          console.error(
            "Error in (cancel): Missing params => dragEl:",
            drag?.itemId,
          )
        }
        setCols(drop?.newState as ColumnProps[])
        /**
         * #1 Makes sure column state can rerender
         */
        setTimeout(() => {
          if (cloneEl) {
            const newEl = document.getElementById(drop?.itemId as string)
            if (!newEl) return
            cloneEl.style.transition = "top 200ms ease, left 200ms ease"
            cloneEl.style.left = `${newEl?.offsetLeft}px`
            cloneEl.style.top = `${newEl?.offsetTop}px`

            /**
             * Waits for transition end. Alternative for listening to transitionend, in case transition never occured.
             */
            setTimeout(() => {
              cloneEl.remove()
              dragEl?.classList.remove("opacity-50")
            }, 200)
          }
        }, 10)
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
    // Check for connection (connecting / pending)
    if (connectionStatus !== "pending" && connectionStatus !== "closing") {
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
          time: new Date(),
        },
      })
    }, 1000)
  }

  function disconnectOperator() {
    if (ws === null) return

    msg({
      type: "disconnect",
      disconnect: {
        user: myname,
      },
    })
    ws.close()
    checkAndSetStatus()
  }

  const broadcastOperator = throttle(
    (event: React.PointerEvent<HTMLDivElement>) => {
      msg({
        type: "move",
        move: { user: myname },
        x: event.pageX,
        y: event.pageY,
      })
    },
    latency,
    {
      trailing: true,
    },
  )

  const broadcastDrag = throttle(
    (event: DragMoveEvent) => {
      msg({
        type: "drag",
        drag: { itemId: event?.active?.id as string },
        x: event.delta.x,
        y: event.delta.y,
      })
    },
    latency,
    {
      trailing: true,
    },
  )

  function cancelDragBroadcast(event: DragCancelEvent) {
    msg({
      type: "cancel",
      cancel: {
        itemId: event.active.id as string,
      },
    })
  }

  function endDragBroadcast(event: DragCancelEvent, newState: ColumnProps[]) {
    msg({
      type: "drop",
      drop: {
        itemId: event.active.id as string,
        newState: newState,
      },
    })
  }

  function startBroadcast(event: DragStartEvent) {
    checkAndSetStatus()
    msg({
      type: "start",
      start: {
        itemId: event.active.id as string,
      },
    })
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
  }
}
