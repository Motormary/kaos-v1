import { DB_Column, DB_Item } from "@/supabase/types"

export type ItemProps = {
  id: string
  index: number
  col: string
  title: string
  body: string
  prio: number
  icon: string
  value: number
}

export type ColumnProps = {
  id: string
  items: ItemProps[]
}

export type MessageProps = {
  remoteClient: string
  message: {
    type:
      | "connect"
      | "connected"
      | "disconnect"
      | "move"
      | "start"
      | "drag"
      | "drop"
      | "cancel"
      | "scroll"
      | "sort"
    x?: number
    y?: number
    newState?: Array<DB_Column & {items: DB_Item[]}>
    currentUsers?: string[]
    overCol?: string
    scroll?: {
      user: string
      y: number
      x?: number
      containerId: number
    }
    connect?: {
      user: string
      connectedAt: Date
    }
    disconnect?: {
      user: string
    }
    move?: {
      user: string
      overCol: string | undefined
    }
    drag?: {
      overCol: string | null
      itemId: number
    }
    sort?: {
      itemId: number
      newCol: number
      newIndex: number
    }
    add?: DB_Item
    drop?: {
      itemId: number
      newCol: number
      newIndex?: number
    }
    cancel?: {
      itemId: number
    }
    start?: {
      itemId: number
    }
  }
}
