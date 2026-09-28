// The VHS shelf's logic (see Shelf.tsx), kept pure so it can be tested without a browser.
export type ShelfFilter = "all" | "movie" | "anime";

// the tapes a filter shows, in shelf order
export const shelfItems = <T extends { kind: "movie" | "anime" }>(items: T[], filter: ShelfFilter): T[] =>
  filter === "all" ? items : items.filter((i) => i.kind === filter);

// the tape the shelf opens on: the middle one, so the spines sit evenly either side
export const middleIndex = (count: number) => Math.floor(count / 2);

// one step (or a jump) along the shelf, stopping at its ends: the shelf doesn't wrap
export const stepIndex = (index: number, delta: number, count: number) =>
  count ? Math.min(Math.max(index + delta, 0), count - 1) : 0;
