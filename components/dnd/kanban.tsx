"use client"

import { initialColumns } from "@/lib/kanban/data"
import { ColumnProps, ItemProps } from "@/lib/kanban/types"
import useBroadCast from "@/lib/kanban/use-connection"
import { addToCol, removeFromCol, reorderItems } from "@/lib/kanban/utils"
import { cn } from "@/lib/utils"
import {
  defaultDropAnimationSideEffects,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  AnimateLayoutChanges,
  defaultAnimateLayoutChanges,
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  CircleCheck,
  CirclePause,
  CircleX,
  MousePointer2,
  Unplug,
} from "lucide-react"
import { useState } from "react"
import { Button } from "../ui/button"

/* 
todo: Handle sorting @ drop <= else DND-animation will not work because of instant setState ✅ ++ send a cancelEvent instead of setting remote state when no changes happen ✅
todo: Reduce rerendering (memo, callbacks?)
 */

export default function DNDKIT() {
  const [cols, setCols] = useState<ColumnProps[]>(initialColumns)
  const [activeItem, setActiveItem] = useState<ItemProps | null>(null)
  const [source, setSource] = useState<string | null>(null)
  const {
    users,
    broadcastDrag,
    broadcastOperator,
    cancelDragBroadcast,
    connectOperator,
    connectionStatus,
    endDragBroadcast,
    startBroadcast,
    disconnectOperator,
  } = useBroadCast(setCols)

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

    if (targetColId !== sourceColId) {
      const newCols = cols.map((col) => {
        if (col.id === over.col) {
          const newItem = { ...activeItem }
          newItem.index = col.items.length
          newItem.col = col.id
          setActiveItem(newItem)
          return addToCol(col, activeItem)
        } else {
          return removeFromCol(col, activeItem.id)
        }
      })
      setCols(newCols)
    }
  }

  function handleDragStart(event: DragStartEvent) {
    startBroadcast(event)
    setSource(event.active.data?.current?.col)
    setActiveItem(event.active.data.current as ItemProps)
  }

  function handleDragEnd(event: DragEndEvent) {
    const over = event?.over?.data.current as ItemProps & {
      type: "item" | "drop"
    }

    const isOverItem = over?.type === "item"

    if (over.id === activeItem?.id && source === over.col) {
      setActiveItem(null)
      setSource(null)
      cancelDragBroadcast(event)
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
      setActiveItem(null)
      setSource(null)
      return
    }

    endDragBroadcast(event, cols)
    setActiveItem(null)
    setSource(null)
  }

  const keyboardSensor = useSensor(KeyboardSensor, {
    keyboardCodes: {
      start: ["Space"],
      cancel: ["Escape"],
      end: ["Enter"],
    },
  })

  const mouseSensor = useSensor(MouseSensor)

  const sensors = useSensors(keyboardSensor, mouseSensor)

  return (
    <div
      onPointerEnter={connectOperator}
      onPointerMove={broadcastOperator}
      className="min-h-svh overflow-x-hidden overflow-y-hidden p-5 outline"
    >
      <Button className="my-2" variant={"outline"} onClick={disconnectOperator}>
        <Unplug />
        Disconnect
      </Button>
      <div className="mb-5 flex items-center gap-2">
        {connectionStatus === "pending" ? (
          <>
            <CirclePause className={cn("size-5 fill-orange-400")} />
            <span>Connection pending...</span>
          </>
        ) : null}
        {connectionStatus === "connected" ? (
          <>
            <CircleCheck className={cn("size-5 fill-green-500")} />
            <span>Connected</span>
          </>
        ) : null}
        {connectionStatus === "closing" ? (
          <>
            <CirclePause className={cn("size-5 fill-orange-400")} />
            <span>Closing connection...</span>
          </>
        ) : null}
        {connectionStatus === "disconnected" ? (
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
      className="bg-muted flex h-full min-h-40 min-w-52 flex-col items-center gap-2 p-2 pb-40 outline"
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
      aria-describedby={`DndDescribeBy-${index}`}
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
