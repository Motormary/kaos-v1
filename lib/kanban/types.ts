
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
      | "newState"
    x?: number
    y?: number
    newState?: ColumnProps[]
    currentUsers?: string[]
    overCol?: string
    scroll?: {
      user: string,
      y: number
      x?: number
      containerId: string
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
      overCol: string
      itemId: string
    }
    drop?: {
      activeItem: ItemProps,
      sourceCol: string,
      sourceItem: ItemProps,
      overIndex?: number
    }
    cancel?: {
      itemId: string
    }
    start?: {
      itemId: string
    }
  }
}
