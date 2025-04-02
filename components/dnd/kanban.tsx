"use client"

import { ItemProps, MessageProps } from "@/lib/kanban/types"
import useBroadCast from "@/lib/kanban/use-broadcast"
import { addToCol, removeFromCol, reorderItems } from "@/lib/kanban/utils"
import { cn } from "@/lib/utils"
import { DB_Column, DB_Item, DB_User } from "@/supabase/types"
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
import { MousePointer2, Plus } from "lucide-react"
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
 */

type props = {
  columns: DB_Column[]
  items: DB_Item[]
  users: DB_User[]
}

type ColumnState = Array<DB_Column & { items: DB_Item[] }>

export default function KanbanBoard({ columns, items }: props) {
  const [cols, setCols] = useState<ColumnState>(
    columns.map((col) => ({
      ...col,
      items: items.filter((item) => item.column_id === col.column_id),
    })),
  )
  const [activeItem, setActiveItem] = useState<DB_Item | null>(null)
  const sourceCol = useRef<string | null>(null)
  const sourceItem = useRef<DB_Item | null>(null)
  const [activeRemoteItemIds, setActiveRemoteItemIds] = useState<number[]>([])

  /* const handleAddItem = useCallback((data: MessageProps['message']['drop']) => {
    setCols(prev => prev.map(col => {
      if (col.id === data?.newCol) {
        return {...col, items: }
      } else return col
      
    }))
  }, []) */

  const handleActiveRemote = useCallback(
    (id: number, action: "add" | "remove") => {
      if (action === "add") {
        const newItems = [...activeRemoteItemIds, id]
        setActiveRemoteItemIds(newItems)
      }
      if (action === "remove") {
        const newItems = activeRemoteItemIds.filter(
          (remoteId) => remoteId !== id,
        )
        setActiveRemoteItemIds(newItems)
      }
    },
    [activeRemoteItemIds],
  )

  function handleRemoteStateChange(data: MessageProps["message"]["drop"]) {
    const localItem: DB_Item = cols.reduce((acc, col) => {
      const isItem = col.items.find((item) => item.item_id === data?.itemId)
      if (isItem) acc = isItem
      return acc
    }, {} as DB_Item)

    if (data?.newCol === localItem.column_id) {
      if (typeof data.newIndex === "number") {
        // Reorder items
        setCols((prev) =>
          prev.map((col) => {
            if (col.column_id === localItem.column_id) {
              return {
                ...col,
                items: reorderItems(
                  col.items,
                  localItem.index,
                  data.newIndex as number,
                ),
              }
            } else return col
          }),
        )
      } else {
        // Add to end of column
        setCols((prev) =>
          prev.map((col) => {
            if (col.column_id === data.newCol) {
              const filteredItems = [
                ...col.items.filter((item) => item.item_id !== data.itemId),
                localItem,
              ]
              const newItems = filteredItems.map((i, index) => ({
                ...i,
                index,
              }))

              return {
                ...col,
                items: newItems,
              }
            } else return col
          }),
        )
      }
    }

    if (data?.newCol !== localItem.column_id) {
      setCols((prev) =>
        prev.map((col) => {
          if (col.column_id === data?.newCol) {
            const newCol = addToCol(col, localItem)
            return {
              ...newCol,
              items:
                typeof data.newIndex === "number"
                  ? reorderItems(newCol.items, col.items.length, data.newIndex)
                  : newCol.items,
            }
          } else return removeFromCol(col, data?.itemId as number)
        }),
      )
    }
  }

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
    broadcastSort,
  } = useBroadCast(handleRemoteStateChange, handleActiveRemote)

  function handleDragOver(e: DragOverEvent) {
    if (!e.over?.data?.current || !activeItem) return
    const sourceColId = activeItem.column_id
    const targetColId = e.over.data.current.col
    const over = e.over.data.current as DB_Item & { type: "item" | "drop" }

    /**
     * If hovered column is not the source-column, add the dragged item to hovered column and remove it from previous
     */
    if (targetColId !== sourceColId) {
      const newCols = cols.map((col) => {
        if (col.column_id === over.column_id) {
          const newItem = { ...activeItem }
          newItem.index = col.items.length
          newItem.column_id = col.column_id
          setActiveItem(newItem)
          //todo: add item to remote clients
          broadcastSort({
            itemId: newItem.item_id,
            newCol: newItem.column_id,
            newIndex: over.type === "item" ? over.index : newItem.index,
          })
          return addToCol(col, activeItem)
        } else {
          return removeFromCol(col, activeItem.item_id)
        }
      })
      setCols(newCols)
    } else if (targetColId === sourceColId) {
      if (over.type === "drop") {
        // this simply makes it possible to drag and drop at the bottom of the container
        setCols((prev) =>
          prev.map((col) => {
            if (col.column_id === activeItem.column_id) {
              const newItems = [
                ...col.items.filter(
                  (item) => item.item_id !== activeItem.item_id,
                ),
              ]
              newItems.push(activeItem)
              const updatedItems = newItems.map((item, index) => {
                if (item.item_id === activeItem.item_id) {
                  setActiveItem({
                    ...item,
                    index,
                  })
                  broadcastSort({
                    itemId: activeItem.item_id,
                    newCol: over.column_id,
                    newIndex: index,
                  })
                }
                return {
                  ...item,
                  index,
                }
              })
              return {
                ...col,
                items: updatedItems,
              }
            } else return col
          }),
        )
      } else if (over.type === "item") {
        broadcastSort({
          itemId: activeItem.item_id,
          newCol: over.column_id,
          newIndex: over.index,
        })
      }
    }
    if (over) setOverRef(document.getElementById(`${over?.column_id}`) ?? null) // dependency of remote animation @ useBroadcast.ts
  }

  function handleDragStart(event: DragStartEvent) {
    startBroadcast(event) // Will connect user to websocket on dragStart (dev purposes)
    sourceCol.current = event.active.data?.current?.col // Source of initiated drag event
    sourceItem.current = event.active.data.current as DB_Item
    setActiveItem(event.active.data.current as DB_Item) // Currently dragged item
  }

  function handleDragEnd(event: DragEndEvent) {
    const over = event?.over?.data.current as DB_Item & {
      type: "item" | "drop"
    }

    const isOverItem = over?.type === "item"

    /**
     * Cancel drag-event if item has not been moved from source location and/or column
     */
    if (!over) {
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
        if (col.column_id === over?.column_id) {
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
        itemId: activeItem?.item_id as number,
        newCol: activeItem?.column_id as number,
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
      itemId: activeItem?.item_id as number,
      newCol: activeItem?.column_id as number,
      newIndex: over.index as number,
    })
    setActiveItem(null)
    sourceCol.current = null
    sourceItem.current = null
  }

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

  function handleAddItem(columnId: number) {
    const newCols = cols.map((col) => {
      if (col.column_id === columnId) {
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
    // setCols(newCols)
  }

  function handleCancel(e: DragCancelEvent) {
    endDragBroadcast(e, {
      itemId: activeItem?.item_id as number,
      newCol: activeItem?.column_id as number,
      newIndex: activeItem?.index,
    })
  }
  return (
    <div
      onPointerMove={broadcastOperator}
      className="dnd-container relative z-20 flex shrink grow-0 flex-col overflow-hidden p-1"
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
              <SortableContext
                key={`column-${col.column_id}`}
                items={col.items.map((item) => ({ id: item.item_id }))}
              >
                <DropContainer
                  setOverRef={setOverRef}
                  // handleAddItem={handleAddItem}
                  onPointerEnter={(e) => setOverRef(e.currentTarget)}
                  index={colIndex}
                  data={col}
                  value={col.items.reduce(
                    (acc, item) => acc + (item.value ?? 0),
                    0,
                  )}
                >
                  {col.items.map((item, index) => (
                    <SortableItem
                      className={cn(
                        activeRemoteItemIds.some(
                          (remoteItem) => remoteItem === item.item_id,
                        ) && "pointer-events-none opacity-50",
                      )}
                      key={`item-${item.item_id}`}
                      colIndex={colIndex}
                      index={index}
                      data={item}
                    />
                  ))}
                </DropContainer>
              </SortableContext>
            )
          })}
          <div
            onDrop={(e) => e.preventDefault()}
            className="text-muted hover:text-muted-foreground hover:bg-muted/50 dark:hover:bg-muted/20 grid min-h-[76svh] w-[340px] cursor-pointer place-items-center border"
          >
            <Plus />
          </div>
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
