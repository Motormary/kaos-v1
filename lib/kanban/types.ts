export type ItemProps = {
  id: string
  index: number
  col: string
}

export type ColumnProps = {
  id: string
  items: ItemProps[]
}

export type MessageProps = {
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