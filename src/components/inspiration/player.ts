// The record player's state: which track is on, whether it plays, and repeat. `seq` counts clip
// (re)starts, so the player knows to rewind and play even when the track stays the same
// (a repeat loop). Pure, so it can be tested without a browser.
export type PlayerState = { index: number; playing: boolean; repeat: boolean; seq: number };

export type PlayerAction =
  | { type: "select"; index: number }
  | { type: "toggle" }
  | { type: "next" }
  | { type: "prev" }
  | { type: "ended" }
  | { type: "repeat" }
  | { type: "pause" };

export const initialPlayer: PlayerState = { index: 0, playing: false, repeat: false, seq: 0 };

const start = (s: PlayerState, index: number): PlayerState => ({ ...s, index, playing: true, seq: s.seq + 1 });

export function playerReducer(s: PlayerState, a: PlayerAction, count: number): PlayerState {
  switch (a.type) {
    case "select":
      if (a.index < 0 || a.index >= count) return s;
      // the track that's on: pick it again to pause or resume
      return a.index === s.index && s.seq > 0 ? { ...s, playing: !s.playing } : start(s, a.index);
    case "toggle":
      // nothing started yet: play the track that's on from the top
      if (s.seq === 0) return start(s, s.index);
      return { ...s, playing: !s.playing };
    case "next":
      return start(s, (s.index + 1) % count);
    case "prev":
      return start(s, (s.index - 1 + count) % count);
    case "ended":
      if (s.repeat) return start(s, s.index);
      // stop after the last track
      return s.index + 1 < count ? start(s, s.index + 1) : { ...s, playing: false };
    case "repeat":
      return { ...s, repeat: !s.repeat };
    case "pause":
      return { ...s, playing: false };
  }
}

// seconds → "m:ss"
export function formatTime(sec: number): string {
  const t = Number.isFinite(sec) && sec > 0 ? Math.floor(sec) : 0;
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}
