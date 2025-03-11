import { url } from "inspector"

/**
 * Ping/latency/lag/throttle
 */
export const latency = 0
export const initialColumns = [
  {
    id: "col-1",
    items: [
      {
        id: "item-1",
        index: 1,
        col: "col-1",
        title: "Oslo",
        body: "The capital city of Norway, known for its green spaces.",
        url: "http://192.168.10.132:8000/assets/oslo.jpg",
      },
      {
        id: "item-2",
        index: 0,
        col: "col-1",
        title: "Bergen",
        body: "A coastal city surrounded by mountains and fjords.",
        url: "http://192.168.10.132:8000/assets/bergen.jpg",
      },
      {
        id: "item-3",
        index: 2,
        col: "col-1",
        title: "Trondheim",
        body: "Home to the Nidaros Cathedral and rich Viking history.",
        url: "http://192.168.10.132:8000/assets/untitled-1.jpg",
      },
    ].toSorted((a, b) => a.index - b.index),
  },
  {
    id: "col-2",
    items: [
      {
        id: "item-4",
        index: 0,
        col: "col-2",
        title: "Tromsø",
        body: "A city known for its Northern Lights and Arctic adventures.",
        url: "http://192.168.10.132:8000/assets/tromso.jpg",
      },
      {
        id: "item-5",
        index: 1,
        col: "col-2",
        title: "Kristiansand",
        body: "A southern city famous for its beaches and zoo.",
        url: "http://192.168.10.132:8000/assets/kristiandsund.jpg",
      },
      {
        id: "item-6",
        index: 2,
        col: "col-2",
        title: "Ålesund",
        body: "Known for its Art Nouveau architecture and coastal beauty.",
        url: "http://192.168.10.132:8000/assets/aalesund.jpg",
      },
    ].toSorted((a, b) => a.index - b.index),
  },
  {
    id: "col-3",
    items: [
      {
        id: "item-7",
        index: 0,
        col: "col-3",
        title: "Haugesund",
        body: "A historical city known for Viking heritage.",
        url: "http://192.168.10.132:8000/assets/haugesund.jpg",
      },
      {
        id: "item-8",
        index: 1,
        col: "col-3",
        title: "Narvik",
        body: "A scenic town with a rich WWII history.",
        url: "http://192.168.10.132:8000/assets/oslo.jpg",
      },
      {
        id: "item-9",
        index: 2,
        col: "col-3",
        title: "Hammerfest",
        body: "One of the northernmost towns in the world.",
        url: "http://192.168.10.132:8000/assets/tromso.jpg",
      },
    ].toSorted((a, b) => a.index - b.index),
  },
]
