export type ItemProps = {
  id: string
  index: number
  col: string
  title: string
  body: string
  url: string
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
    x?: number
    y?: number
    currentUsers?: string[]
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
}
