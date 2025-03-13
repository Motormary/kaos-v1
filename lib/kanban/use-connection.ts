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
  const [scrollContainer, setScrollContainer] = useState("")
  const mainScrollX = mainRef.current?.scrollLeft ?? 0
  const mainScrollY = mainRef.current?.scrollTop ?? 0
  let isRemoteScroll = false
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
          currentUsers,
          type,
          overCol,
          connect,
          disconnect,
          start,
          drag,
          drop,
          cancel,
          move,
          scroll,
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
        setUsers((prev) => [...prev, remoteClient])
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
      if (type === "scroll") {
        const containerEl = document.getElementById(scroll?.containerId as string)
        if (containerEl) {
          //! PREVENT LOOP
          const viewEL = containerEl.children.item(1)
          if (viewEL) {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            isRemoteScroll = true // Mark the next scroll as remote
            viewEL.scrollTo({
              top: scroll?.y,
              behavior: "instant",
            })
            setTimeout(() => (isRemoteScroll = false), 100)
          }
        }
      }
      if (type === "move") {
        const mouse = document?.getElementById(remoteClient)
        if (mouse) {
          const offsetX = (x ?? 0) - 3.5
          const offsetY = (y ?? 0) - 3.5
          mouse.style.transition = "top 0ms linear, left 0ms linear"
          mouse.style.left = `${offsetX - (mainRef?.current?.scrollLeft ?? 0) - window.scrollX}px`
          mouse.style.top = `${offsetY - (mainRef?.current?.scrollTop ?? 0) - window.scrollY}px`
        }
      }

      if (type === "start") {
        if (isDraggingRef.current) return
        isDraggingRef.current = true
        console.log("start")
        const dragEl = document.getElementById(start?.itemId as string)

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
        const rect = dragEl.getBoundingClientRect()
        const clone = dragEl.cloneNode(true) as HTMLElement
        document.body.appendChild(clone)
        clone.classList.add("ghost")
        const offsetX = rect.left + (x ?? 0)
        const offsetY = rect.top + (y ?? 0)
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
        console.log("drag")
        const cloneEl = document.getElementById(`${drag?.itemId}-clone`)
        const dragEl = document.getElementById(drag?.itemId as string)
        if (!cloneEl || !dragEl) return
        // const dragRect = dragEl.getBoundingClientRect()
        // const containerRect = containerEl?.getBoundingClientRect()
        const offsetX = x ?? 0 + window.scrollX
        const offsetY = y ?? 0 + window.scrollY
        cloneEl.style.left = `${offsetX}px` //! + (container).scrollX
        cloneEl.style.top = `${offsetY}px`
      }
      if (type === "cancel") {
        console.log("cancel")
        const dragEl = document.getElementById(cancel?.itemId as string)
        const cloneEl = document.getElementById(`${cancel?.itemId}-clone`)
        const containerEL = document.getElementById(overCol as string)
        if (!dragEl || !cloneEl) return
        if (cloneEl && containerEL) {
          const dragRect = dragEl.getBoundingClientRect()
          cloneEl.style.transition = "top 200ms ease, left 200ms ease"
          cloneEl.style.left = `${dragRect.left}px`
          cloneEl.style.top = `${dragRect.top}px`

          // Waits for transition end. Alternative for listening to transitionend, in case transition never occurred.

          setTimeout(() => {
            cloneEl.remove()
            dragEl?.classList.remove("opacity-50")
            isDraggingRef.current = false
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
         * Makes sure column state can rerender
         */
        setTimeout(() => {
          if (cloneEl) {
            const newEl = document.getElementById(drop?.itemId as string)
            const containerEL = document.getElementById(overCol as string)
            if (!newEl || !containerEL) return
            const newRect = newEl.getBoundingClientRect()
            cloneEl.style.transition = "top 200ms ease, left 200ms ease"
            cloneEl.style.left = `${newRect.left}px`
            cloneEl.style.top = `${newRect.top}px`

            /**
             * Waits for transition end. Alternative for listening to transitionend, in case transition never occurred.
             */
            setTimeout(() => {
              cloneEl.remove()
              dragEl?.classList.remove("opacity-50")
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
      const containerEl = document.getElementById(scrollContainer as string)
      msg({
        type: "move",
        move: { user: myname },
        x: event.pageX + mainScrollX + window.scrollX + (containerEl?.scrollLeft ?? 0),
        y: event.pageY + mainScrollY + window.scrollY + (containerEl?.scrollTop ?? 0),
      })
    },
    latency,
  )

  const broadcastScroll = throttle((event: React.UIEvent<HTMLDivElement>) => {
    if (isRemoteScroll) return
    //! WEE
    //! WOO
    //! WEE
    //! WOO
    //! =>>>>>> THIS IS A DANGEROUS LOOP, IT IS TRIGGERED BY THE WHEEL EVENT WHICH TRIGGERS A WHEEL EVENT FOR EVERY USER WHICH TRIGGERS EVERY USER WHICH TRIGGERS EVERY USER WHICH TRIGGERS EVERY USER... ONE TURN OF THE SCROLL === 40x WS.MESSAGE <===== High prio
    //! WEE
    //! WOO
    //! WEE
    //! WOO
    //! 🚓
    //! THROTTLE IS NOT ENOUGH
    console.log("SCROLL EVENT!")
    const target = event.target as HTMLDivElement
    if (target && "scrollTop" in target) {
      msg({
        type: "scroll",
        scroll: {
          user: myname,
          y: target.scrollTop,
          containerId: scrollContainer,
        },
      })
    }
  }, 100)

  const broadcastDrag = throttle(
    (event: DragMoveEvent) => {
      msg({
        type: "drag",
        drag: { itemId: event?.active?.id as string },
        x: (event.active.rect.current.translated?.left ?? 0) + mainScrollX,
        y: (event.active.rect.current.translated?.top ?? 0) + mainScrollY,
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

  function setOverRef(id: string) {
    if (id) {
      setScrollContainer(id)
    }
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
    broadcastScroll,
  }
}
