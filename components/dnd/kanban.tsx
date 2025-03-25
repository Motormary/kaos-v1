"use client"

import { initialColumns } from "@/lib/kanban/data"
import { ColumnProps, ItemProps, MessageProps } from "@/lib/kanban/types"
import useBroadCast from "@/lib/kanban/use-broadcast"
import { addToCol, removeFromCol, reorderItems } from "@/lib/kanban/utils"
import {
  defaultDropAnimationSideEffects,
  DndContext,
  DragCancelEvent,
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
import { useCallback, useRef, useState } from "react"
import ConnectionBar from "./connection-bar"
import DropContainer from "./drop-container"
import Item from "./item"
import SortableItem from "./sortable-item"
/* 
todo: barrel imports
todo: offline storage for owner
todo: Add/remove function for columns/items
todo: add throttle... again (Get around the compiler .current @ render)
todo: fix/bundle types/params for functions
!bug: fix mobile drag offset
 */

export default function KanbanBoard() {
  const [cols, setCols] = useState<ColumnProps[]>(initialColumns)
  const [activeItem, setActiveItem] = useState<ItemProps | null>(null)
  const sourceCol = useRef<string | null>(null)
  const sourceItem = useRef<ItemProps | null>(null)

  /* const handleAddItem = useCallback((data: MessageProps['message']['drop']) => {
    setCols(prev => prev.map(col => {
      if (col.id === data?.newCol) {
        return {...col, items: }
      } else return col
      
    }))
  }, []) */

  const handleSetCols = useCallback(
    (data: MessageProps["message"]["drop"]) => {
      const localItem: ItemProps = cols.reduce((acc, col) => {
        const isItem = col.items.find((item) => item.id === data?.itemId)
        if (isItem) acc = isItem
        return acc
      }, {} as ItemProps)

      if (data?.newCol === localItem.col) {
        if (data.newIndex) {
          setCols((prev) =>
            prev.map((col) => {
              if (col.id === localItem.col) {
                return {
                  ...col,
                  items: reorderItems(
                    col.items,
                    localItem.index,
                    data.newIndex as number,
                  ),
                }
              }
              return col
            }),
          )
        } else {
          setCols((prev) =>
            prev.map((col) => {
              if (col.id === data.newCol) {
                const newItems = [
                  ...col.items.filter((item) => item.id !== data.itemId),
                  localItem,
                ]
                return {
                  ...col,
                  items: newItems,
                }
              } else return col
            }),
          )
        }
      }

      if (data?.newCol !== localItem.col) {
        setCols((prev) =>
          prev.map((col) => {
            if (col.id === data?.newCol) {
              const newCol = addToCol(col, localItem)
              return {
                ...newCol,
                items:
                  typeof data.newIndex === "number"
                    ? reorderItems(
                        newCol.items,
                        col.items.length,
                        data.newIndex,
                      )
                    : newCol.items,
              }
            }
            return removeFromCol(col, data?.itemId as string)
          }),
        )
      }
    },
    [cols],
  )

  const colCount = cols?.length ? cols.length : 1
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
    //broadcastNewState,
  } = useBroadCast(handleSetCols)

  const handleDragOver = useCallback(
    (e: DragOverEvent) => {
      if (!e.over?.data?.current || !activeItem) return
      const sourceColId = activeItem.col
      const targetColId = e.over.data.current.col
      const over = e.over.data.current as ItemProps & { type: "item" | "drop" }
      console.log("🚀 ~ KanbanBoard ~ over:", over)

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
            //todo: add item to remote clients
            return addToCol(col, activeItem)
          } else {
            return removeFromCol(col, activeItem.id)
          }
        })
        setCols(newCols)
      } else if (targetColId === sourceColId && over.type === "drop") {
        // this simply makes it possible to drag and drop at the bottom of the container
        setCols((prev) =>
          prev.map((col) => {
            if (col.id === activeItem.col) {
              const newItems = [
                ...col.items.filter((item) => item.id !== activeItem.id),
                activeItem,
              ]
              return {
                ...col,
                items: newItems,
              }
            } else return col
          }),
        )
      }
      if (over) setOverRef(document.getElementById(over?.col) ?? null) // dependency of remote animation @ useBroadcast.ts
    },
    [activeItem, cols, setOverRef],
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      startBroadcast(event) // Will connect user to websocket on dragStart (dev purposes)
      sourceCol.current = event.active.data?.current?.col // Source of initiated drag event
      sourceItem.current = event.active.data.current as ItemProps
      setActiveItem(event.active.data.current as ItemProps) // Currently dragged item
    },
    [startBroadcast],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const over = event?.over?.data.current as ItemProps & {
        type: "item" | "drop"
      }

      const isOverItem = over?.type === "item"

      /**
       * Cancel drag-event if item has not been moved from source location and/or column
       */
      if (over?.id === activeItem?.id && sourceCol.current === over?.col) {
        setActiveItem(null)
        sourceCol.current = null
        sourceItem.current = null
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

        endDragBroadcast(event, {
          itemId: activeItem?.id as string,
          newCol: activeItem?.col as string,
          newIndex: over.index as number,
        })
        setCols(newCols)
        setActiveItem(null)
        sourceCol.current = null
        sourceItem.current = null

        return
      }

      /**
       * Item has been added to end of new column (locally with handleDragOver), update remote clients.
       */
      endDragBroadcast(event, {
        itemId: activeItem?.id as string,
        newCol: activeItem?.col as string,
        newIndex: over.index as number,
      })
      setActiveItem(null)
      sourceCol.current = null
      sourceItem.current = null
    },
    [cancelDragBroadcast, cols, endDragBroadcast, sourceCol, activeItem],
  )

  const keyboardSensor = useSensor(KeyboardSensor, {
    keyboardCodes: {
      start: ["Space"],
      cancel: ["Escape"],
      end: ["Enter"],
    },
    scrollBehavior: "instant",
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

  const handleAddItem = useCallback(
    (columnId: string) => {
      const newCols = cols.map((col) => {
        if (col.id === columnId) {
          const newItem = {
            id: Math.random().toString(),
            index: col.items.length,
            col: columnId,
            title: "New item!",
            body: "Successfully added new item.",
            prio: 2,
            icon: "Trophy",
            value: 100000,
          }
          return {
            ...col,
            items: [...col.items, newItem],
          }
        }
        return col
      })
      //! NEW FUNCTION NEEDED
      /*       broadcastNewState({
        itemId: newItem.id,
        newCol: col.id,
        newIndex: col.items.length,
      }) */
      setCols(newCols)
    },
    [cols],
  )

  const handleCancel = useCallback(
    (e: DragCancelEvent) =>
      endDragBroadcast(e, {
        itemId: activeItem?.id as string,
        newCol: activeItem?.col as string,
        newIndex: activeItem?.index,
      }),
    [endDragBroadcast, activeItem],
  )

  return (
    <div
      onPointerMove={broadcastOperator}
      className="dnd-container relative z-50 flex shrink grow-0 flex-col overflow-hidden p-1"
    >
      <ConnectionBar
        setOverRef={setOverRef}
        connectOperator={connectOperator}
        connectionStatus={connectionStatus}
        disconnectOperator={disconnectOperator}
        users={users}
        colCount={colCount}
      />
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragMove={broadcastDrag}
        onDragCancel={handleCancel}
      >
        <div className="dnd-columns flex overflow-x-auto">
          {cols.map((col, colIndex) => {
            return (
              <SortableContext key={col.id} items={col.items}>
                <DropContainer
                  setOverRef={setOverRef}
                  handleAddItem={handleAddItem}
                  onPointerEnter={(e) => setOverRef(e.currentTarget)}
                  index={colIndex}
                  data={col}
                  value={col.items.reduce((acc, item) => acc + item.value, 0)}
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
                /* Smoother drop/cancel animation for scaling */
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
