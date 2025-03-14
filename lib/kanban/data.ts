
/**
 * Ping/latency/lag/throttle
 */
export const latency = 0
export const initialColumns = [
  {
    id: "Prospects",
    items: [
      {
        id: "item-1",
        index: 1,
        col: "Prospects",
        title: "Acme Corp",
        body: "Mid-sized manufacturing company exploring new suppliers.",
        prio: 0
      },
      {
        id: "item-2",
        index: 0,
        col: "Prospects",
        title: "TechNova",
        body: "Innovative SaaS startup interested in scaling operations.",
        prio: 1
      },
      {
        id: "item-3",
        index: 2,
        col: "Prospects",
        title: "GreenFields Inc",
        body: "Agritech firm seeking sustainable solutions for farming.",
        prio: 0
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
        title: "Bright Solutions",
        body: "Energy company showing interest in a product demo.",
        prio: 2
      },
      {
        id: "item-5",
        index: 1,
        col: "Leads",
        title: "MarketHive",
        body: "E-commerce platform evaluating potential partnerships.",
        prio: 1
      },
      {
        id: "item-6",
        index: 2,
        col: "Leads",
        title: "NextGen Retail",
        body: "Retail chain considering a pilot for a new service.",
        prio: 1
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
        title: "FutureTech",
        body: "Had an initial meeting to discuss project requirements.",
        prio: 0
      },
      {
        id: "item-8",
        index: 1,
        col: "Contacted",
        title: "EcoBuild Co",
        body: "Sent proposal and awaiting feedback.",
        prio: 2
      },
      {
        id: "item-9",
        index: 2,
        col: "Contacted",
        title: "SkyNet Logistics",
        body: "Followed up after demo; interest in pricing options.",
        prio: 0
      },
    ].toSorted((a, b) => a.index - b.index),
  },
];

