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
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { SortableContext } from "@dnd-kit/sortable"
import {
  CircleCheck,
  CirclePause,
  CircleX,
  MousePointer2,
  ScreenShare,
  ScreenShareOff,
} from "lucide-react"
import { useState } from "react"
import { Button } from "../ui/button"
import { DropContainer } from "./drop-container"
import SortableItem from "./sortable-item"
import { SortableItem as Item } from "./item"

/* 
todo: Reduce rerendering (memo, callbacks?)
todo: Add remove columns/items
todo: Refactor/style components
 */

export default function KanbanBoard() {
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
    broadcastScroll,
    setOverRef,
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

    if (over?.id === activeItem?.id && source === over?.col) {
      setActiveItem(null)
      setSource(null)
      cancelDragBroadcast(event)
      return
    }

    if (isOverItem) {
      const newCols = cols.map((col) => {
        if (col.id === over?.col) {
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

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 300,
      tolerance: 100,
      distance: 200,
    },
  })
  const mouseSensor = useSensor(MouseSensor)
  const sensors = useSensors(keyboardSensor, mouseSensor, touchSensor)

  return (
    <div
      onPointerEnter={connectOperator}
      onPointerMove={broadcastOperator}
      className="mx-auto flex w-full flex-col p-5"
    >
      {connectionStatus === "connected" ? (
        <Button
          className="my-2 w-fit"
          variant={"outline"}
          onClick={() => {
            disconnectOperator()
          }}
        >
          <ScreenShareOff />
          Disconnect
        </Button>
      ) : (
        <Button
          disabled={connectionStatus !== "disconnected"}
          className="my-2 w-fit"
          variant={"outline"}
          onClick={connectOperator}
        >
          <ScreenShare />
          Connect
        </Button>
      )}
      <div className="mb-5 flex items-center gap-2">
        {connectionStatus === "pending" ? (
          <>
            <CirclePause
              className={cn("size-5 fill-orange-400 stroke-[1.5px]")}
            />
            <span>Connecting...</span>
          </>
        ) : null}
        {connectionStatus === "connected" ? (
          <>
            <CircleCheck
              className={cn("size-5 fill-green-400 stroke-[1.5px]")}
            />
            <span>Connected</span>
          </>
        ) : null}
        {connectionStatus === "closing" ? (
          <>
            <CirclePause
              className={cn("size-5 fill-orange-400 stroke-[1.5px]")}
            />
            <span>Disconnecting...</span>
          </>
        ) : null}
        {connectionStatus === "disconnected" ? (
          <>
            <CircleX className={cn("size-5 fill-red-400 stroke-[1.5px]")} />
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
        <div className="flex" suppressHydrationWarning>
          {cols.map((col, colIndex) => {
            return (
              <SortableContext key={col.id} items={col.items}>
                <DropContainer
                  onPointerEnter={setOverRef}
                  onScrollCapture={broadcastScroll}
                  index={colIndex}
                  data={col}
                >
                  {col.items.map((item, index) => (
                    <SortableItem
                      key={item.id + index}
                      colIndex={colIndex}
                      index={index}
                      data={item}
                    />
                  ))}
                </DropContainer>
              </SortableContext>
            )
          })}
        </div>
        <DragOverlay
          wrapperElement="ul"
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
            <Item
              className="animate-pop bg-background"
              active={true}
              data={activeItem}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      {connectionStatus === "connected" && users?.length
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
