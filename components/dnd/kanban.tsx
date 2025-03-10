"use client"

import { cn } from "@/lib/utils"
import { ws } from "@/lib/websocket"
import {
  defaultDropAnimationSideEffects,
  DndContext,
  DragCancelEvent,
  DragEndEvent,
  DragMoveEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  DropAnimation,
  KeyboardSensor,
  MouseSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  AnimateLayoutChanges,
  arrayMove,
  defaultAnimateLayoutChanges,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CircleCheck, CirclePause, CircleX, MousePointer2 } from "lucide-react"
import { useState } from "react"

const initialColumns = [
  {
    id: "col-1",
    items: [
      { id: "item-1", index: 0, col: "col-1" },
      { id: "item-2", index: 1, col: "col-1" },
      { id: "item-3", index: 2, col: "col-1" },
    ].toSorted((a, b) => a.index - b.index),
  },
  {
    id: "col-2",
    items: [
      { id: "item-4", index: 0, col: "col-2" },
      { id: "item-5", index: 1, col: "col-2" },
      { id: "item-6", index: 2, col: "col-2" },
    ].toSorted((a, b) => a.index - b.index),
  },
  {
    id: "col-3",
    items: [
      { id: "item-7", index: 0, col: "col-3" },
      { id: "item-8", index: 1, col: "col-3" },
      { id: "item-9", index: 2, col: "col-3" },
    ].toSorted((a, b) => a.index - b.index),
  },
]

type ItemProps = {
  id: string
  index: number
  col: string
}

type ColumnProps = {
  id: string
  items: ItemProps[]
}

type MessageProps = {
  type: "connect" | "disconnect" | "move" | "start" | "drag" | "drop" | "cancel"
  x?: number
  y?: number
  connect?: {
    user: string
    time: Date
  }
  disconnect?: {
    user: string
  }
  move?: {
    user: string
  }
  drag?: {
    itemId: string
  }
  drop?: {
    itemId: string
    newState?: ColumnProps[]
  }
  cancel?: {
    itemId: string
  }
  start?: {
    itemId: string
  }
}

function msg(data: MessageProps) {
  if (ws.readyState !== 1)
    console.warn("Message not sent, readyState:", ws.readyState)
  try {
    const msg = JSON.stringify(data)
    ws.send(msg)
  } catch (e) {
    console.log("Websocket request failed:", e)
  }
}

/**
 * todo: create a hook for websockets with mounted check (avoid hydration issues)
 */

export default function DNDKIT() {
  const [cols, setCols] = useState<ColumnProps[]>(initialColumns)
  const [activeItem, setActiveItem] = useState<ItemProps | null>(null)

  function addToCol(
    col: ColumnProps,
    item: ItemProps | null,
    over: DragOverEvent["over"],
  ): ColumnProps {
    if (!item || !col)
      throw new Error("Error adding item to column, params missing")
    /**
     * Add item to column, checks if hovered item is an item, if so, change active index to over.index then reset all indexes, else add to bottom. //? Potentially expensive db-operation
     */
    // todo: try handling the reordering on drop
    return {
      ...col,
      items: /* over?.data?.current?.type === "item"
          ? reorderItems(
              [...col.items, { ...item, col: col.id }],
              col.items.length,
              over?.data?.current?.index,
            )
          :  */ [
        ...col.items,
        { ...item, col: col.id, index: col.items.length } as ItemProps,
      ],
    }
  }

  function removeFromCol(col: ColumnProps, activeId: string): ColumnProps {
    if (typeof activeId !== "string" || !col)
      throw new Error("Error removing item from column, params missing")
    return {
      ...col,
      items: col.items.filter((item) => item.id !== activeId),
    }
  }

  function reorderItems(
    items: ItemProps[],
    activeIndex: number,
    overIndex: number,
  ): ItemProps[] {
    if (
      !items?.length ||
      typeof activeIndex !== "number" ||
      typeof overIndex !== "number"
    )
      throw new Error("Error reordering items, params missing")
    const sortedArray = arrayMove(items, activeIndex, overIndex)

    sortedArray.forEach((i, index) => {
      i.index = index
    })

    return sortedArray
  }

  function handleDragOver(
    e: DragOverEvent & {
      activatorEvent: {
        clientX: number
        clientY: number
      }
    },
  ) {
    if (!e.over?.data?.current || !activeItem) return
    const sourceColId = activeItem.col
    const targetColId = e.over.data.current.col
    const over = e.over.data.current as ItemProps & { type: "item" | "drop" }
    const isOverItem = over.type === "item"

    if (targetColId !== sourceColId) {
      const newCols = cols.map((col) => {
        if (col.id === over.col) {
          const newItem = { ...activeItem }
          newItem.index = isOverItem ? over.index : (col.items.length ?? 0)
          newItem.col = col.id
          setActiveItem(newItem)
          return addToCol(col, activeItem, e.over)
        } else {
          return removeFromCol(col, activeItem.id)
        }
      })
      setCols(newCols)
    }
  }

  //! -------------------------------WEBSOCKET START------------------------------------------

  const [users, setUsers] = useState<string[]>([])

  ws.onmessage = (event) => {
    const {
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
    }: MessageProps = JSON.parse(event.data)

    const isConnected = users?.some(
      (user) => user?.toLowerCase() === connect?.user?.toLowerCase(),
    )

    if (type === "connect") {
      if (isConnected) {
        return
      }
      console.info("Connecting user:", connect?.user)
      setUsers((prev) => [...prev, connect?.user as string])
    }

    if (type === "disconnect") {
      if (isConnected) {
        setUsers((prev) => prev.filter((user) => user !== disconnect?.user))
      }
    }

    if (type === "move") {
      const mouse = document?.getElementById(move?.user as string)
      if (mouse) {
        const offsetX = (x ?? 0) - 3.5
        const offsetY = (y ?? 0) - 3.5
        mouse.style.left = `${offsetX}px`
        mouse.style.top = `${offsetY}px`
      } else {
        console.error(
          "Error in (move), missing parameters => mouseId:",
          move?.user,
          "x:",
          x,
          "y:",
          y,
        )
        return
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
      clone.style.transition = "scale 100ms ease"
      clone.style.scale = "1.05"
      clone.classList.add("shadow-xl")
      clone.style.pointerEvents = "none"
      dragEl.classList.add("opacity-10")
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
      cloneEl?.remove()
      dragEl?.classList?.remove("opacity-10")
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
      dragEl?.classList.remove("opacity-10")
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
           * Waits for transition end. Alternativ for listening to transitionend, in case transition never occured.
           */
          setTimeout(() => {
            cloneEl.remove()
          }, 200)
        }
      }, 10)
      // deployAgent()
    }
  }

  function connectOperator() {
    msg({
      type: "connect",
      connect: {
        user: "Admin",
        time: new Date(),
      },
    })
  }

  function disconnectOperator() {
    msg({
      type: "disconnect",
      disconnect: {
        user: "Admin",
      },
    })
  }

  function broadcastOperator(event: React.PointerEvent<HTMLDivElement>) {
    msg({
      type: "move",
      move: { user: "Admin" },
      x: event.pageX,
      y: event.pageY,
    })
  }

  function broadcastDrag(event: DragMoveEvent) {
    msg({
      type: "drag",
      drag: { itemId: event.active.id as string },
      x: event.delta.x,
      y: event.delta.y,
    })
  }

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
  /*  let timeout: NodeJS.Timeout
  function deployAgent() {
    clearTimeout(timeout)
    const clones = document.querySelectorAll(".ghost")

    timeout = setTimeout(() => {
      clones.forEach((clone) => clone.remove())
    }, 3000)
  } */

  //!-----------------------------------END------------------------------------------------------

  const keyboardSensor = useSensor(KeyboardSensor, {
    keyboardCodes: {
      start: ["Space"],
      cancel: ["Escape"],
      end: ["Enter"],
    },
  })

  const mouseSensor = useSensor(MouseSensor)

  const sensors = useSensors(keyboardSensor, mouseSensor)

  const pending = ws.readyState.toString() === "0"
  const connected = ws.readyState === 1
  const closing = ws.readyState === 2
  const disconnected = ws.readyState === 3

  const dropAnimationConfig: DropAnimation = {
    keyframes({ transform }) {
      return [
        { transform: CSS.Transform.toString(transform.initial) },
        {
          transform: CSS.Transform.toString({
            ...transform.final,
            scaleX: 0.94,
            scaleY: 0.94,
          }),
        },
      ]
    },
    sideEffects({ active, dragOverlay }) {
      active.node.style.opacity = "0"

      const button = dragOverlay.node.querySelector("button")

      if (button) {
        button.animate(
          [
            {
              boxShadow:
                "-1px 0 15px 0 rgba(34, 33, 81, 0.01), 0px 15px 15px 0 rgba(34, 33, 81, 0.25)",
            },
            {
              boxShadow:
                "-1px 0 15px 0 rgba(34, 33, 81, 0), 0px 15px 15px 0 rgba(34, 33, 81, 0)",
            },
          ],
          {
            duration: 250,
            easing: "ease",
            fill: "forwards",
          },
        )
      }

      return () => {
        active.node.style.opacity = ""
      }
    },
  }

  return (
    <div
      onPointerEnter={connectOperator}
      onPointerMove={broadcastOperator}
      className="min-h-svh overflow-x-hidden overflow-y-hidden p-5 outline"
    >
      {/* <Button className="my-2" variant={'outline'} onClick={() => ws.close()}><Unplug />Disconnect</Button> */}
      <div className="mb-5 flex items-center gap-2">
        {pending ? (
          <>
            <CirclePause className={cn("size-5 fill-orange-400")} />
            <span>Connection pending...</span>
          </>
        ) : null}
        {connected ? (
          <>
            <CircleCheck className={cn("size-5 fill-green-500")} />
            <span>Connected</span>
          </>
        ) : null}
        {closing ? (
          <>
            <CirclePause className={cn("size-5 fill-orange-400")} />
            <span>Closing connection...</span>
          </>
        ) : null}
        {disconnected ? (
          <>
            <CircleX className={cn("size-5 fill-red-500")} />
            <span>Disconnected</span>
          </>
        ) : null}
      </div>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragMove={broadcastDrag}
        onDragCancel={(e) => endDragBroadcast(e, cols)}
      >
        <div className="flex gap-20" suppressHydrationWarning>
          {cols.map((col, colIndex) => {
            return (
              <SortableContext key={col.id} items={col.items}>
                <Dropzone index={colIndex} data={col}>
                  {col.items.map((item, index) => (
                    <SomeItem
                      key={item.id + index}
                      colIndex={colIndex}
                      index={index}
                      data={item}
                    />
                  ))}
                </Dropzone>
              </SortableContext>
            )
          })}
        </div>
        <DragOverlay
          dropAnimation={{
            duration: 200,
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: "0.5",
                },
                dragOverlay: {
                  translate: "-5px -3px",
                  transition: "translate 200ms ease",
                },
              },
            }),
          }}
        >
          {activeItem ? (
            <SomeItem
              className="animate-pop ring-offset-background ring ring-offset-2"
              data={activeItem}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      {users?.length
        ? users.map((user, index) => (
            <div
              key={`${user}-${index}`}
              id={user}
              className="pointer-events-none absolute z-50 w-fit"
            >
              <MousePointer2 className="fill-emerald-300 stroke-emerald-900" />{" "}
              <div className="w-fit translate-x-5 translate-y-[-0.25rem] rounded-sm border bg-emerald-200 px-1 py-0.5 text-xs">
                {user}
              </div>
            </div>
          ))
        : null}
    </div>
  )

  function handleDragStart(event: DragStartEvent) {
    startBroadcast(event)
    setActiveItem(event.active.data.current as ItemProps)
  }

  function handleDragEnd(event: DragEndEvent) {
    const over = event?.over?.data.current as ItemProps & {
      type: "item" | "drop"
    }
    if (!over) {
      cancelDragBroadcast(event)
    }
    const isOverItem = over?.type === "item"

    if (over?.id === activeItem?.id) {
      endDragBroadcast(event, cols)
      setActiveItem(null)
      return
    }

    if (isOverItem) {
      const newCols = cols.map((col) => {
        if (col.id === over.col) {
          return {
            ...col,
            items: reorderItems(
              col.items,
              activeItem?.index as number,
              over.index as number,
            ),
          }
        }
        return col
      })

      endDragBroadcast(event, newCols)
      setCols(newCols)
    } else {
      endDragBroadcast(event, cols)
    }
    setActiveItem(null)
  }
}

function Dropzone({
  children,
  data,
  index,
}: {
  children: React.ReactNode
  data: ColumnProps
  index: number
}) {
  const { setNodeRef } = useDroppable({
    id: data.id,
    data: {
      colIndex: index,
      col: data.id,
      type: "drop",
    },
  })

  return (
    <div
      ref={setNodeRef}
      className="bg-muted flex h-full min-h-40 min-w-52 flex-col items-center gap-2 p-2 outline"
    >
      {children}
    </div>
  )
}

function SomeItem({
  className,
  children,
  data,
  index,
  colIndex,
}: {
  data: ItemProps
  children?: React.ReactNode
  className?: string
  index?: number
  colIndex?: number
}) {
  const animateLayoutChanges: AnimateLayoutChanges = (args) =>
    defaultAnimateLayoutChanges({ ...args, wasDragging: true })

  const { active, attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: data.id,
      data: {
        ...data,
        index,
        type: "item",
        colIndex,
      },
      animateLayoutChanges,
    })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <button
      id={data.id}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      draggable
      className={cn(
        className,
        active?.id === data.id && "animate-fade-half opacity-50",
        active?.id !== data.id &&
          "ring-offset-background focus-visible:ring focus-visible:ring-offset-2",
        "w-48 rounded-sm bg-white p-5 outline",
      )}
    >
      <p>item: {data.id}</p>
      <p>data-index: {data.index}</p>
      <p>index: {index}</p>
      {children}
    </button>
  )
}
