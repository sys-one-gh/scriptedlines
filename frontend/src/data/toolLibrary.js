export const toolLibrary = {
  products: [
    {
      id: "base-cabinet",
      name: "Base Cabinet",
      items: Array.from({ length: 30 }, (_, i) => ({
        id: `base-${i + 1}`,
        name: `Base Cabinet Type ${i + 1}`,
      })),
    },
    {
      id: "wall-cabinet",
      name: "Wall Cabinet",
      items: Array.from({ length: 25 }, (_, i) => ({
        id: `wall-${i + 1}`,
        name: `Wall Cabinet Type ${i + 1}`,
      })),
    },
    {
      id: "tall-cabinet",
      name: "Tall Cabinet",
      items: Array.from({ length: 20 }, (_, i) => ({
        id: `tall-${i + 1}`,
        name: `Tall Cabinet Type ${i + 1}`,
      })),
    },
  ],

  subassemblies: [
    {
      id: "toe-kick",
      name: "Toe Kick",
      items: Array.from({ length: 20 }, (_, i) => ({
        id: `toe-${i + 1}`,
        name: `Toe Kick Variant ${i + 1}`,
      })),
    },
    {
      id: "countertop",
      name: "Countertop",
      items: Array.from({ length: 20 }, (_, i) => ({
        id: `counter-${i + 1}`,
        name: `Countertop Style ${i + 1}`,
      })),
    },
  ],

  hardware: [
    {
      id: "hinge",
      name: "Hinge",
      items: Array.from({ length: 25 }, (_, i) => ({
        id: `hinge-${i + 1}`,
        name: `Hinge Type ${i + 1}`,
      })),
    },
    {
      id: "handle",
      name: "Handle",
      items: Array.from({ length: 25 }, (_, i) => ({
        id: `handle-${i + 1}`,
        name: `Handle Style ${i + 1}`,
      })),
    },
  ],

  materials: [
    {
      id: "mdf",
      name: "MDF",
      items: Array.from({ length: 20 }, (_, i) => ({
        id: `mdf-${i + 1}`,
        name: `MDF Grade ${i + 1}`,
      })),
    },
    {
      id: "plywood",
      name: "Plywood",
      items: Array.from({ length: 20 }, (_, i) => ({
        id: `ply-${i + 1}`,
        name: `Plywood Type ${i + 1}`,
      })),
    },
  ],
};