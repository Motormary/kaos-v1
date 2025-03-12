
/**
 * Ping/latency/lag/throttle
 */
export const latency = 50
export const initialColumns = [
  {
    id: "Prospects",
    items: [
      {
        id: "item-1",
        index: 1,
        col: "Prospects",
        title: "Silje 💗",
        body: "The capital city of Norway, known for its green spaces.",
      },
      {
        id: "item-2",
        index: 0,
        col: "Prospects",
        title: "Bergen",
        body: "A coastal city surrounded by mountains and fjords.",
      },
      {
        id: "item-3",
        index: 2,
        col: "Prospects",
        title: "Trondheim",
        body: "Home to the Nidaros Cathedral and rich Viking history.",
      },
    ].toSorted((a, b) => a.index - b.index),
  },
  {
    id: "Leads",
    items: [
      {
        id: "item-4",
        index: 0,
        col: "Leads",
        title: "Tromsø",
        body: "A city known for its Northern Lights and Arctic adventures.",
      },
      {
        id: "item-5",
        index: 1,
        col: "Leads",
        title: "Kristiansand",
        body: "A southern city famous for its beaches and zoo.",
      },
      {
        id: "item-6",
        index: 2,
        col: "Leads",
        title: "Ålesund",
        body: "Known for its Art Nouveau architecture and coastal beauty.",
      },
    ].toSorted((a, b) => a.index - b.index),
  },
  {
    id: "Contacted",
    items: [
      {
        id: "item-7",
        index: 0,
        col: "Contacted",
        title: "Haugesund",
        body: "A historical city known for Viking heritage.",
      },
      {
        id: "item-8",
        index: 1,
        col: "Contacted",
        title: "Narvik",
        body: "A scenic town with a rich WWII history.",
      },
      {
        id: "item-9",
        index: 2,
        col: "Contacted",
        title: "Hammerfest",
        body: "One of the northernmost towns in the world.",
      },
    ].toSorted((a, b) => a.index - b.index),
  },
]
