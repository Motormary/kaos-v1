/**
 * Ping/latency/lag/throttle
 */
export const latency = 0

export const initialColumns = [
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
  }]