"use client"

import { initialColumns } from "@/lib/kanban/data"
import { ColumnProps, ItemProps } from "@/lib/kanban/types"
import useBroadCast from "@/lib/kanban/use-broadcast"
import { addToCol, removeFromCol, reorderItems } from "@/lib/kanban/utils"
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
import { MousePointer2 } from "lucide-react"
import { useState } from "react"
import ConnectionBar from "./connection-bar"
import { DropContainer } from "./drop-container"
import Item from "./item"
import SortableItem from "./sortable-item"
/* 
todo: barrel imports
todo: Reduce rerendering (memo, callbacks?)
todo: Add/remove function for columns/items
todo: use refs for state
todo: handle auto-connect better
// !bug: fix restrict to window issue, item cannot be sorted to the bottom easily
// !bug: if remote user has a larger screen the current user can drag out of bounds and get draggable clone stuck 
!bug: make empty bottom of source-column droppable
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
    if (over) setOverRef(document.getElementById(over?.col) ?? null) // dependency of remote animation @ useBroadcast.ts

    /**
     * If hovered column is not the source-column, add the dragged item to hovered column and remove it from previous
     */
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
    startBroadcast(event) // Will connect user to websocket on dragStart (dev purposes)
    setSource(event.active.data?.current?.col) // Source of initiated drag event
    setActiveItem(event.active.data.current as ItemProps) // Currently dragged item
  }

  function handleDragEnd(event: DragEndEvent) {
    const over = event?.over?.data.current as ItemProps & {
      type: "item" | "drop"
    }

    const isOverItem = over?.type === "item"

    /**
     * Cancel drag-event if item has not been moved from source location and/or column
     */
    if (over?.id === activeItem?.id && source === over?.col) {
      setActiveItem(null)
      setSource(null)
      cancelDragBroadcast(event)
      return
    }

    /**
     * If hovering an item, swap active items' index with hovered item
     */
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

    /**
     * Item has been added to end of new column (locally with handleDragOver), update remote clients.
     */
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
      distance: 50,
      tolerance: 0,
    },
  })
  const mouseSensor = useSensor(MouseSensor)
  const sensors = useSensors(keyboardSensor, mouseSensor, touchSensor)

  return (
    <div
      onPointerEnter={connectOperator}
      onPointerMove={broadcastOperator}
      className="dnd-container relative z-50 flex flex-col overflow-x-hidden overflow-y-hidden"
    >
      <ConnectionBar
        connectOperator={connectOperator}
        connectionStatus={connectionStatus}
        disconnectOperator={disconnectOperator}
        users={users}
      />
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragMove={broadcastDrag}
        onDragCancel={(e) => endDragBroadcast(e, cols)}
      >
        <div className="dnd-columns flex overflow-x-auto">
          {cols.map((col, colIndex) => {
            return (
              <SortableContext key={col.id} items={col.items}>
                <DropContainer
                  onPointerEnter={(e) => setOverRef(e.currentTarget)}
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
        {/* Drag animation */}
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
      {/* Remote client cursors */}
      {connectionStatus === "connected" && users?.length
        ? users.map((user, index) => (
            <div
              key={`${user}-${index}`}
              id={user}
              className="pointer-events-none absolute z-50 w-fit"
            >
              <MousePointer2 className="fill-emerald-300 stroke-emerald-900" />{" "}
              <div className="w-full translate-x-5 translate-y-[-0.25rem] rounded-sm border bg-emerald-200 px-1 py-0.5 text-xs whitespace-nowrap text-black">
                {user}
              </div>
            </div>
          ))
        : null}
    </div>
  )
}
