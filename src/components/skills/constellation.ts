// The skill constellation: its geometry (and, from Task 2, its drawing) as plain functions with no
// React and no DOM of their own, so the Node tests can run them
// (docs/superpowers/specs/2026-09-30-skill-constellation-design.md §3).
//
// World space is in "overview pixels" for a 1240 × 720 board: x right, y up, z toward the viewer.
// A camera Pose orbits a target point and scales the world onto the real board.

// ---------- types and constants ----------
export type Vec3 = { x: number; y: number; z: number };
export type BranchShape = { title: string; skills: string[]; items: number };
export type SkyBranch = {
  title: string;
  names: string[]; // the skills' names, in learning order
  stars: Vec3[]; // one per skill, scattered
  sizes: number[]; // each star's size: the first learned biggest (1.5), the newest smallest (0.75)
  locked: Vec3; // the hollow next-quest star, at the end of the lines
  items: Vec3[]; // faint item dots
  name: Vec3; // where the constellation's name sits
};
export type Sky = { planet: Vec3; branches: SkyBranch[]; field: Vec3[][]; layout: Layout; world: Viewport };
// a line between two constellations' stars ([branch, skill] each), with its label
export type Link = { from: readonly [number, number]; to: readonly [number, number]; label: string };
export type Pose = { tx: number; ty: number; tz: number; yaw: number; pitch: number; zoom: number };
export type Viewport = { w: number; h: number };
export type Screen = { x: number; y: number; scale: number; depth: number };
export type Side = "left" | "right";
// the sky's arrangement: "wide" on desktop (names beside the stars), "tall" on phones (icons only)
export type Layout = "wide" | "tall";

export const WORLD = { w: 1240, h: 720 }; // the wide arrangement's world
export const TALL_WORLD = { w: 600, h: 1000 }; // the tall arrangement's world
export const FOCAL = 1400; // perspective distance, in world px
export const CARD_W = 320; // the HUD card's width
export const EDGE = 24; // the clear margin at the board's edges and beside the card
export const LABEL_H = 18; // a skill label's line height
export const LABEL_GAP = 20; // a skill label's distance from its star, clear of the biggest icon
// a skill star is its icon: this many px at scale 1, times the star's size (0.75–1.5), so ≈12–24px
// on desktop and ≈17–33px on phones
export const ICON: Record<Layout, number> = { wide: 16, tall: 22 };
export const iconPx = (layout: Layout, size: number) => ICON[layout] * size;
// on phones the card is a sheet up from the board's bottom edge, at most this share of its height
export const SHEET = 0.55;

// The boards the layout is made on: the star map's board at 1440×900, 1100×800, 901×800, 1366×650
// and 1920×1080 windows. On each, in the overview, every label and name is on the board and clear of
// every other label, name, star and line. (Labels are HTML at a fixed size, so small boards crowd
// them most; the sizes in between follow.)
// (the tightest first, so most spots that don't fit are ruled out on the first board)
export const REF_BOARDS: Viewport[] = [
  { w: 808, h: 619 },
  { w: 1231, h: 480 },
  { w: 989, h: 619 },
  { w: 1300, h: 719 },
  { w: 1780, h: 899 },
];
// The boards the tall arrangement is made on: the sky's board at 375×667, 390×844, 430×932 and
// 768×1024 windows (the tightest first). On each, every icon (its tap target), locked star and name
// is on the board and clear of the others and of every line. (Measured in the browser in Task 3.)
export const REF_TALL: Viewport[] = [
  { w: 327, h: 518 },
  { w: 342, h: 695 },
  { w: 382, h: 783 },
  { w: 720, h: 875 },
];

// Each branch's patch of sky, in data order: Frontend above the planet, Motion & 3D right, Data
// below, Design left (world x0..x1 × y0..y1, and its depth). Its stars scatter inside, the first one
// in `first`, on the side nearest the planet. The constellations stand on their own: told apart by
// colour, grouping and the gaps between them, with no lines to the planet.
type Region = { x0: number; x1: number; y0: number; y1: number; z: number; first: { x0: number; x1: number; y0: number; y1: number } };
const REGIONS: Region[] = [
  { x0: -320, x1: 200, y0: 110, y1: 285, z: -50, first: { x0: -220, x1: 100, y0: 110, y1: 170 } },
  { x0: 170, x1: 430, y0: -200, y1: 180, z: 40, first: { x0: 170, x1: 280, y0: -90, y1: 90 } },
  { x0: -320, x1: 200, y0: -300, y1: -110, z: -10, first: { x0: -220, x1: 100, y0: -170, y1: -110 } },
  { x0: -575, x1: -370, y0: -190, y1: 170, z: 60, first: { x0: -470, x1: -370, y0: -90, y1: 90 } },
];
// The tall arrangement's patches (world 600 × 1000), in data order: Frontend at the top, Motion & 3D
// upper right, Data at the bottom, Design lower left; the planet in the middle.
const TALL_REGIONS: Region[] = [
  { x0: -215, x1: 215, y0: 250, y1: 405, z: -40, first: { x0: -120, x1: 120, y0: 250, y1: 300 } },
  { x0: 20, x1: 215, y0: -30, y1: 200, z: 40, first: { x0: 20, x1: 120, y0: -30, y1: 90 } },
  { x0: -215, x1: 215, y0: -405, y1: -270, z: -10, first: { x0: -120, x1: 120, y0: -320, y1: -270 } },
  { x0: -215, x1: -20, y0: -230, y1: 30, z: 50, first: { x0: -120, x1: -20, y0: -110, y1: 30 } },
];
const OUT = 70; // how far past its patch the locked star may step
const TURN = { min: 50, max: 150 }; // how far (degrees) each line turns from the one before
const TRIES = 250; // random spots tried for each star
const ATTEMPTS = 80; // times a constellation may start over
// the background starfield: three layers, deeper ones drifting less as the camera moves, spread
// wide enough to fill the whole full-screen sky around the board
const FIELD = [
  { n: 230, z: -380 },
  { n: 155, z: -240 },
  { n: 100, z: -120 },
];
// How each arrangement is laid out: its world; the boards it's checked on; the patches; a line's
// length between neighbouring stars; the least distance between stars of different constellations
// (gap) and of one constellation (own); how far a constellation must spread both ways (and neither
// way under `ratio` of the other); whether stars have their names beside them; a star's clear
// radius on a board (px, from its size and depth scale); how far the background stars spread.
type LayoutPlan = {
  world: Viewport;
  boards: Viewport[];
  regions: Region[];
  step: { min: number; max: number };
  gap: number;
  own: number;
  spread: { min: number; ratio: number };
  labels: boolean;
  starR: (size: number, ls: number) => number;
  field: { x: number; y: number };
};
const PLANS: Record<Layout, LayoutPlan> = {
  wide: {
    world: WORLD,
    boards: REF_BOARDS,
    regions: REGIONS,
    step: { min: 60, max: 105 },
    gap: 110,
    own: 50,
    spread: { min: 90, ratio: 0.45 },
    labels: true,
    // the icon, scaled with depth, and 2px of air
    starR: (size, ls) => (iconPx("wide", size) / 2) * ls + 2,
    field: { x: 1300, y: 920 },
  },
  tall: {
    world: TALL_WORLD,
    boards: REF_TALL,
    regions: TALL_REGIONS,
    step: { min: 95, max: 125 },
    gap: 135,
    own: 90,
    spread: { min: 70, ratio: 0.35 },
    labels: false,
    // the 44px tap target (or the icon, if bigger), scaled with depth
    starR: (size, ls) => Math.max(22, iconPx("tall", size) / 2 + 2) * ls,
    field: { x: 700, y: 1400 },
  },
};


export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

// ---------- the HTML labels' sizes (the layout and the framing must leave room for them) ----------
// skill labels are 13px, 12px on boards under 1000px wide
export const labelPx = (vp: Viewport) => (vp.w < 1000 ? 12 : 13);
// a skill label's reach from its star: the gap, then ~0.57em a character
export const labelW = (name: string, px = 13) => LABEL_GAP + name.length * px * 0.57;
// labels grow and shrink a little with depth
export const labelScale = (scale: number) => Math.min(1.1, Math.max(0.9, scale));
// a constellation name's width: 10px mono capitals with 1.5px tracking
export const nameW = (title: string) => title.length * 7.6;

// ---------- layout ----------
type Pt = { x: number; y: number };
type Box = { x: number; y: number; w: number; h: number };
const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const turn = (a: Pt, b: Pt, c: Pt) => Math.sign((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x));
// two lines cross (touching at an end doesn't count)
const crosses = (p1: Pt, p2: Pt, p3: Pt, p4: Pt) => turn(p1, p2, p3) * turn(p1, p2, p4) < 0 && turn(p3, p4, p1) * turn(p3, p4, p2) < 0;
// a line runs through a box
function through(p: Pt, q: Pt, b: Box) {
  const inBox = (u: Pt) => u.x > b.x && u.x < b.x + b.w && u.y > b.y && u.y < b.y + b.h;
  if (inBox(p) || inBox(q)) return true;
  const c = [
    { x: b.x, y: b.y },
    { x: b.x + b.w, y: b.y },
    { x: b.x + b.w, y: b.y + b.h },
    { x: b.x, y: b.y + b.h },
  ];
  return c.some((a, i) => crosses(p, q, a, c[(i + 1) % 4]));
}
const dotBox = (s: Pt, r: number): Box => ({ x: s.x - r, y: s.y - r, w: 2 * r, h: 2 * r });
// (boxes get a few px of air)
function labelBox(s: Screen, name: string, px: number): Box {
  const ls = labelScale(s.scale);
  return { x: s.x + LABEL_GAP * ls - 3, y: s.y - (LABEL_H * ls) / 2 - 2, w: (labelW(name, px) - LABEL_GAP) * ls + 6, h: LABEL_H * ls + 4 };
}
const tagBox = (s: Pt, dx: number, text: string): Box => ({ x: s.x + dx - 3, y: s.y - 9, w: nameW(text) + 6, h: 18 });
const onBoard = (b: Box, vp: Viewport) => b.x >= EDGE && b.y >= EDGE && b.x + b.w <= vp.w - EDGE && b.y + b.h <= vp.h - EDGE;

// What's already in the sky, on one reference board, in board px: text (labels, names, the synergy
// label), dots (stars, the planet, items; `id` marks a line's own end), and lines.
type Board = { vp: Viewport; px: number; text: Box[]; dots: { id: string; box: Box }[]; lines: [Pt, Pt][] };

// The whole sky for an arrangement, seeded (the same every visit). Constellation by constellation,
// each star takes a random step from the one before, inside its branch's patch, until it lands
// somewhere that keeps, on every reference board: its icon (and, wide, its label) on the board and
// clear of all text, dots and lines; its line clear of all text and dots and crossing no other line;
// and a gap from the other constellations. The locked star steps outward from the last one; then
// the name (above), then the item dots.
export function layoutSky(shapes: BranchShape[], seed = 11, synergy?: Link, layout: Layout = "wide"): Sky {
  const L = PLANS[layout];
  const r = seeded(seed);
  const j = (a: number) => (r() * 2 - 1) * a;
  const cam = overviewPose();
  const at = (v: Vec3, vp: Viewport) => project(v, cam, vp, L.world);
  const planet: Vec3 = { x: 0, y: 0, z: 0 };
  const boards: Board[] = L.boards.map((vp) => {
    const pl = at(planet, vp);
    return { vp, px: labelPx(vp), text: [], dots: [{ id: "planet", box: { x: pl.x - 28, y: pl.y - 18, w: 56, h: 36 } }], lines: [] };
  });
  const placed: { b: number; p: Vec3 }[] = []; // every star so far, for the gaps between constellations
  const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
  // a star's clear radius on a board (see PLANS); a locked star's ring
  const radius = (size: number | null, s: Screen) => (size === null ? 7 : L.starR(size, labelScale(s.scale)));

  // can a star (with its label, if it has one) go at c, joined by a line from `from` (its id; a
  // constellation's first star has none)? `size` is null for a locked star.
  const fitsStar = (c: Vec3, label: string | null, size: number | null, from: Vec3 | null, fromId: string) =>
    boards.every((B) => {
      const s = at(c, B.vp);
      const rad = radius(size, s);
      const lab = label ? labelBox(s, label, B.px) : null;
      const dot = dotBox(s, rad);
      if ((lab && !onBoard(lab, B.vp)) || !onBoard(dotBox(s, rad - 1), B.vp)) return false;
      if (B.text.some((o) => overlaps(dot, o) || (lab && overlaps(lab, o)))) return false;
      if (B.dots.some((o) => overlaps(dot, o.box) || (lab && overlaps(lab, o.box)))) return false;
      if (B.lines.some(([a, b]) => through(a, b, dotBox(s, rad - 2)) || (lab && through(a, b, lab)))) return false;
      if (!from) return true;
      const f = at(from, B.vp);
      // its line: clear of all text (this label too) and of every dot but the one it starts from
      if ([...B.text, ...(lab ? [lab] : [])].some((o) => through(f, s, o))) return false;
      if (B.dots.some((o) => o.id !== fromId && through(f, s, dotBox({ x: o.box.x + o.box.w / 2, y: o.box.y + o.box.h / 2 }, Math.min(o.box.w, o.box.h) / 2 - 1)))) return false;
      return !B.lines.some(([a, b]) => crosses(a, b, f, s));
    });
  // puts a star in; returns how to take it out again
  const addStar = (c: Vec3, label: string | null, size: number | null, from: Vec3 | null, id: string) => {
    const before = boards.map((B) => [B.text.length, B.dots.length, B.lines.length]);
    boards.forEach((B) => {
      const s = at(c, B.vp);
      if (label) B.text.push(labelBox(s, label, B.px));
      B.dots.push({ id, box: dotBox(s, radius(size, s)) });
      if (from) B.lines.push([at(from, B.vp), s]);
    });
    return () =>
      boards.forEach((B, i) => {
        B.text.length = before[i][0];
        B.dots.length = before[i][1];
        B.lines.length = before[i][2];
      });
  };
  // can a tag (a name or the synergy label) go at c: on the board, clear of all text, dots and lines?
  const fitsTag = (c: Vec3, dx: number, text: string, lines = true) =>
    boards.every((B) => {
      const t = tagBox(at(c, B.vp), dx, text);
      return (
        onBoard(t, B.vp) &&
        !B.text.some((o) => overlaps(t, o)) &&
        !B.dots.some((o) => overlaps(t, o.box)) &&
        !(lines && B.lines.some(([a, b]) => through(a, b, t)))
      );
    });
  const addTag = (c: Vec3, dx: number, text: string) => boards.forEach((B) => B.text.push(tagBox(at(c, B.vp), dx, text)));

  // the synergy line's later end (the label is placed with it) and the star at its other end
  const [synLate, synEarly] = synergy
    ? synergy.from[0] * 100 + synergy.from[1] > synergy.to[0] * 100 + synergy.to[1]
      ? [synergy.from, synergy.to]
      : [synergy.to, synergy.from]
    : [null, null];
  const done: SkyBranch[] = [];

  // (where a constellation gets stuck, it's taken out again and redrawn)
  const snapshot = () => ({ at: boards.map((B) => [B.text.length, B.dots.length, B.lines.length]), placed: placed.length });
  const restore = (sn: ReturnType<typeof snapshot>) => {
    boards.forEach((B, i) => {
      B.text.length = sn.at[i][0];
      B.dots.length = sn.at[i][1];
      B.lines.length = sn.at[i][2];
    });
    placed.length = sn.placed;
  };

  const branches = shapes.map((shape, b): SkyBranch => {
    const R = L.regions[b % L.regions.length];
    const inR = (p: Pt, out = 0) => p.x >= R.x0 - out && p.x <= R.x1 + out && p.y >= R.y0 - out && p.y <= R.y1 + out;
    const own: Vec3[] = [];
    // world rules: its gap from the other constellations, and room from its own stars
    const clear = (c: Vec3) => dist(c, planet) >= 90 && placed.every((q) => (q.b === b ? dist(c, q.p) >= L.own : dist(c, q.p) >= L.gap));
    // each star's size: the first learned biggest (1.5), the newest smallest (0.75), a little wobble
    const n = shape.skills.length;
    const sizes = shape.skills.map((_, k) => (n > 1 ? 1.5 - (0.75 * k) / (n - 1) : 1.5) + j(0.05));

    // the next star (`size` null: the locked one): the first of TRIES random spots that fits, or null
    // (`force`: the last spot tried)
    const place = (label: string | null, size: number | null, outward: boolean, force: boolean): Vec3 | null => {
      const k = own.length;
      const prev = own[k - 1] ?? null;
      const fromId = `${b}.${k - 1}`;
      const text = L.labels ? label : null; // wide: its name beside it
      const synHere = !!synLate && !!synEarly && synLate[0] === b && synLate[1] === k && size !== null;
      let last: Vec3 | null = null;
      for (let t = 0; t < TRIES; t++) {
        let c: Vec3;
        if (!prev) {
          c = { x: R.first.x0 + r() * (R.first.x1 - R.first.x0), y: R.first.y0 + r() * (R.first.y1 - R.first.y0), z: R.z + j(55) };
        } else {
          const a = r() * Math.PI * 2;
          const len = L.step.min + r() * (L.step.max - L.step.min);
          c = { x: prev.x + Math.cos(a) * len, y: prev.y + Math.sin(a) * len, z: R.z + j(55) };
        }
        if (!inR(c, outward ? OUT : 0) || !clear(c) || (outward && prev && dist(c, planet) <= dist(prev, planet))) continue;
        // keep turning: no straight runs, no doubling back
        const pp = own[k - 2];
        if (prev && pp) {
          const u = { x: prev.x - pp.x, y: prev.y - pp.y };
          const v = { x: c.x - prev.x, y: c.y - prev.y };
          const deg = (Math.acos((u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y))) * 180) / Math.PI;
          if (deg < TURN.min || deg > TURN.max) continue;
        }
        last = c;
        if (!fitsStar(c, text, size, prev, fromId)) continue;
        const undo = addStar(c, text, size, prev, `${b}.${k}`);
        if (synHere) {
          // the synergy label goes halfway along its line: it has to fit too
          const other = synEarly![0] === b ? own[synEarly![1]] : done[synEarly![0]]?.stars[synEarly![1]];
          const mid = other ? { x: (other.x + c.x) / 2, y: (other.y + c.y) / 2, z: (other.z + c.z) / 2 } : null;
          if (mid && !fitsTag(mid, 8, synergy!.label, false)) {
            undo();
            continue;
          }
          if (mid) addTag(mid, 8, synergy!.label);
        }
        own.push(c);
        placed.push({ b, p: c });
        return c;
      }
      if (!force) return null;
      const c = last ?? { x: (R.x0 + R.x1) / 2, y: (R.y0 + R.y1) / 2, z: R.z };
      addStar(c, text, size, prev, `${b}.${k}`);
      own.push(c);
      placed.push({ b, p: c });
      return c;
    };

    // the name: the nearest free spot above the constellation, from its top-left corner (below it if
    // there's no room above), and clearly nearer its own stars than any other constellation's; null
    // if it won't fit
    const placeName = (force: boolean): Vec3 | null => {
      const xs = own.map((p) => p.x);
      const ys = own.map((p) => p.y);
      const zc = own.reduce((s, p) => s + p.z, 0) / own.length;
      const x0 = Math.min(...xs) - 20;
      const x1 = Math.max(...xs) - 20;
      for (const up of [true, false]) {
        for (let dy = 26; dy <= 80; dy += 6) {
          for (let x = x0; x <= x1; x += 10) {
            const c = { x, y: up ? Math.max(...ys) + dy : Math.min(...ys) - dy, z: zc };
            const mine = Math.min(...own.map((p) => dist(c, p)));
            if (placed.some((q) => q.b !== b && dist(c, q.p) * 0.75 <= mine)) continue;
            if (fitsTag(c, 0, shape.title)) {
              addTag(c, 0, shape.title);
              return c;
            }
          }
        }
      }
      if (!force) return null;
      const c = { x: Math.min(...xs), y: Math.max(...ys) + 40, z: zc };
      addTag(c, 0, shape.title);
      return c;
    };

    // the constellation, star by star, then the locked star and the name; stuck, or come out in
    // too thin a line, it starts over
    let stars: Vec3[] = [];
    let locked: Vec3 = planet;
    let name: Vec3 = planet;
    for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
      const force = attempt === ATTEMPTS - 1;
      const sn = snapshot();
      own.length = 0;
      stars = [];
      for (let k = 0; k < n; k++) {
        const c = place(shape.skills[k], sizes[k], false, force);
        if (!c) break;
        stars.push(c);
      }
      const spread = (v: number[]) => Math.max(...v) - Math.min(...v);
      const sx = spread(stars.map((p) => p.x));
      const sy = spread(stars.map((p) => p.y));
      const broad = stars.length < 3 || (sx >= L.spread.min && sy >= L.spread.min && Math.min(sx, sy) / Math.max(sx, sy) >= L.spread.ratio);
      const l = stars.length === n && (broad || force) ? place(null, null, true, force) : null;
      const nm = l ? placeName(force) : null;
      if (l && nm) {
        locked = l;
        name = nm;
        break;
      }
      restore(sn);
    }

    // the item dots: faint, around the constellation, off every label and star
    const items = Array.from({ length: shape.items }, (_, i) => {
      let spot: Vec3 | null = null;
      for (let t = 0; t < TRIES * 2 && !spot; t++) {
        const c = { x: R.x0 - 30 + r() * (R.x1 - R.x0 + 60), y: R.y0 - 30 + r() * (R.y1 - R.y0 + 60), z: R.z + j(40) };
        if (placed.some((q) => q.b !== b && dist(c, q.p) < L.gap * 0.6)) continue;
        const ok = boards.every((B) => {
          const d = dotBox(at(c, B.vp), 5);
          return onBoard(d, B.vp) && !B.text.some((o) => overlaps(d, o)) && !B.dots.some((o) => overlaps(d, o.box));
        });
        if (ok) spot = c;
      }
      const c = spot ?? { x: (R.x0 + R.x1) / 2, y: R.y1, z: R.z };
      boards.forEach((B) => B.dots.push({ id: `${b}.item${i}`, box: dotBox(at(c, B.vp), 5) }));
      return c;
    });

    const br = { title: shape.title, names: shape.skills, stars, sizes, locked, items, name };
    done.push(br);
    return br;
  });
  const field = FIELD.map((l) => Array.from({ length: l.n }, () => ({ x: j(L.field.x), y: j(L.field.y), z: l.z + j(30) })));
  return { planet, branches, field, layout, world: L.world };
}

// ---------- camera ----------
export const fit = (vp: Viewport, world: Viewport = WORLD) => Math.min(vp.w / world.w, vp.h / world.h);

// a world point → the board, for a camera pose: turned by yaw (about the vertical) and pitch (about
// the horizontal) around the target, then in perspective (nearer = bigger)
export function project(p: Vec3, cam: Pose, vp: Viewport, world: Viewport = WORLD): Screen {
  let x = p.x - cam.tx;
  let y = p.y - cam.ty;
  let z = p.z - cam.tz;
  const cy = Math.cos(cam.yaw);
  const sy = Math.sin(cam.yaw);
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  const cp = Math.cos(cam.pitch);
  const sp = Math.sin(cam.pitch);
  [y, z] = [y * cp - z * sp, y * sp + z * cp];
  const persp = FOCAL / Math.max(FOCAL - z, 1);
  const k = fit(vp, world) * cam.zoom * persp;
  return { x: vp.w / 2 + x * k, y: vp.h / 2 - y * k, scale: cam.zoom * persp, depth: z };
}

export const overviewPose = (): Pose => ({ tx: 0, ty: 0, tz: 0, yaw: 0, pitch: 0, zoom: 1 });

// the phones' mini sky: the whole map tipped toward the viewer, turned to `yaw`. Tipped, what
// swings to the front drops, so the aim sits a little low and the zoom leaves room for a full turn.
export const miniPose = (yaw: number): Pose => ({ ...overviewPose(), ty: -35, yaw, pitch: 0.35, zoom: 0.8 });

// the card goes on the side away from what it's about
export const cardSide = (x: number, vp: Viewport): Side => (x < vp.w / 2 ? "right" : "left");

// the pose that frames branch b beside the card (wide) or above the sheet (tall), and the card's side
export function branchPose(sky: Sky, b: number, vp: Viewport): { pose: Pose; side: Side } {
  const br = sky.branches[b];
  const tall = sky.layout === "tall";
  const W = sky.world;
  const px = labelPx(vp);
  const centreX = br.stars.reduce((sum, p) => sum + project(p, overviewPose(), vp, W).x, 0) / Math.max(br.stars.length, 1);
  const side: Side = tall ? "right" : cardSide(centreX, vp);
  // the free space: beside the card (wide) or above the sheet (tall)
  const free = tall
    ? { x: EDGE, y: EDGE, w: vp.w - EDGE * 2, h: vp.h * (1 - SHEET) - EDGE * 2 }
    : { x: side === "right" ? EDGE : CARD_W + EDGE * 2, y: EDGE, w: vp.w - CARD_W - EDGE * 3, h: vp.h - EDGE * 2 };
  // how far each point reaches left, right and up/down, in px: a star's icon (wide, with its label to
  // the right) or its tap target (tall), else a ring, a dot or a name
  const reach = (size: number) => (tall ? Math.max(22, iconPx("tall", size) / 2 + 2) : iconPx("wide", size) / 2 + 2) * 1.1;
  const parts = [
    ...br.stars.map((p, i) => ({ p, l: reach(br.sizes[i]), r: tall ? reach(br.sizes[i]) : 1.1 * labelW(br.names[i], px), v: tall ? reach(br.sizes[i]) : LABEL_H })),
    { p: br.locked, l: 12, r: 12, v: 12 },
    ...br.items.map((p) => ({ p, l: 9, r: 9, v: 9 })),
    { p: br.name, l: 0, r: nameW(br.title), v: 9 },
  ];
  const left = (k: number) => Math.min(...parts.map((q) => q.p.x * k - q.l));
  const right = (k: number) => Math.max(...parts.map((q) => q.p.x * k + q.r));
  const top = (k: number) => Math.max(...parts.map((q) => q.p.y * k + q.v));
  const bottom = (k: number) => Math.min(...parts.map((q) => q.p.y * k - q.v));
  const fits = (k: number) => right(k) - left(k) <= free.w && top(k) - bottom(k) <= free.h;
  // the biggest scale (world px → board px) that fits, with a little air
  let lo = 0.1;
  let hi = fit(vp, W) * 2.2;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (fits(m)) lo = m;
    else hi = m;
  }
  const k = lo * 0.94;
  const tz = br.stars.reduce((sum, p) => sum + p.z, 0) / Math.max(br.stars.length, 1);
  // aim so the framed box's middle lands in the middle of the free space
  const cx = (left(k) + right(k)) / 2 / k;
  const cy = (top(k) + bottom(k)) / 2 / k;
  return {
    side,
    pose: {
      tx: cx + (vp.w / 2 - (free.x + free.w / 2)) / k,
      ty: cy - (vp.h / 2 - (free.y + free.h / 2)) / k,
      tz,
      yaw: tall ? 0 : side === "right" ? 0.06 : -0.06, // turned a touch toward the card
      pitch: 0,
      zoom: k / fit(vp, W),
    },
  };
}

// the pose that brings the planet up close: left of the card (wide), or above the sheet (tall)
export function planetPose(vp: Viewport, layout: Layout = "wide"): { pose: Pose; side: Side } {
  const W = layout === "tall" ? TALL_WORLD : WORLD;
  const zoom = 2.4;
  const k = fit(vp, W) * zoom;
  if (layout === "tall") {
    const freeCy = EDGE + (vp.h * (1 - SHEET) - EDGE * 2) / 2;
    return { side: "right", pose: { tx: 0, ty: -(vp.h / 2 - freeCy) / k, tz: 0, yaw: 0.08, pitch: -0.05, zoom } };
  }
  const free = vp.w - CARD_W - EDGE * 3;
  const freeCx = EDGE + free / 2;
  return { side: "right", pose: { tx: -(freeCx - vp.w / 2) / k, ty: 0, tz: 0, yaw: 0.08, pitch: -0.05, zoom } };
}

// ---------- drawing ----------
// What drawSky needs for one frame. `focus` is the constellation that stays lit while the others
// dim (-1 = the planet, which dims them all; -2 = none).
export type Paint = {
  sky: Sky;
  pose: Pose;
  vp: Viewport;
  colors: string[]; // each branch's colour, as hex
  reveal: number; // the entrance, 0 → 1
  dim: number; // 0 → 1: how far the unlit constellations have faded
  focus: number;
  hover: { b: number; s: number } | null;
  picked: { b: number; s: number } | null;
  time: number; // seconds, for the twinkle and the planet's glint
  still: boolean; // reduced motion: no twinkle, no glint
  synergy?: { from: readonly [number, number]; to: readonly [number, number] };
  glow?: (color: string) => CanvasImageSource | null;
  names?: boolean; // write the constellation names on the canvas (the mini sky; the map uses HTML)
  // where the background stars may go, in board px (default: the board). On desktop the canvas
  // covers the whole full-screen sky, beyond the constellations' board.
  bounds?: { x0: number; y0: number; x1: number; y1: number };
};

const TAU = Math.PI * 2;
const INK = "#f2f0f7"; // --text-strong
const DUST = "#cfcbe0"; // the background stars
const LAV = "#b9b2cf"; // --lav
const VIOLET = "#9a6bff"; // --collide

// the entrance: the planet first, then each constellation star by star (all in by reveal = 1)
export const appearPlanet = (reveal: number) => clamp01(reveal / 0.12);
export function appear(reveal: number, b: number, k: number, branches: number, stars: number) {
  const start = 0.14 + ((b + k / stars) / branches) * 0.72;
  return clamp01((reveal - start) / 0.12);
}
// a constellation's brightness: full, or faded while another is lit
export const branchAlpha = (p: Pick<Paint, "dim" | "focus">, b: number) => (p.focus === b ? 1 : 1 - 0.75 * p.dim);

export function drawSky(ctx: CanvasRenderingContext2D, p: Paint) {
  const { sky, vp } = p;
  const P = (v: Vec3) => project(v, p.pose, vp, sky.world);
  const nB = sky.branches.length;
  const line = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };
  const disc = (x: number, y: number, r: number) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
  };
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = 1;

  // background stars, three layers deep
  const pa = appearPlanet(p.reveal);
  const B = p.bounds ?? { x0: 0, y0: 0, x1: vp.w, y1: vp.h };
  if (pa > 0) {
    ctx.fillStyle = DUST;
    sky.field.forEach((layer, li) => {
      ctx.globalAlpha = (0.16 + li * 0.12) * pa;
      const size = 0.8 + li * 0.35;
      for (const v of layer) {
        const s = P(v);
        if (s.x > B.x0 - 4 && s.y > B.y0 - 4 && s.x < B.x1 + 4 && s.y < B.y1 + 4) ctx.fillRect(s.x, s.y, size, size);
      }
    });
  }

  // each constellation: faint lines in learning order (dashed to the locked star, brighter around a
  // hovered star), and its item dots
  const planet = P(sky.planet);
  sky.branches.forEach((br, b) => {
    const n = br.stars.length + 1;
    const ba = branchAlpha(p, b);
    const show = (k: number) => appear(p.reveal, b, k, nB, n) * ba;
    const pts = [...br.stars, br.locked].map(P);
    ctx.strokeStyle = p.colors[b];
    for (let k = 1; k < n; k++) {
      if (show(k) <= 0) continue;
      const lit = p.hover?.b === b && (p.hover.s === k || p.hover.s === k - 1);
      ctx.globalAlpha = (lit ? 0.75 : 0.3) * show(k);
      ctx.setLineDash(k === n - 1 ? [4, 4] : []);
      line(pts[k - 1], pts[k]);
    }
    ctx.setLineDash([]);
    if (show(n - 1) > 0) {
      ctx.globalAlpha = 0.5 * show(n - 1);
      ctx.fillStyle = p.colors[b];
      for (const v of br.items) {
        const s = P(v);
        disc(s.x, s.y, 1.5 * Math.min(2, s.scale));
        ctx.fill();
      }
    }
  });

  // the synergy link, dashed violet
  if (p.synergy) {
    const [fb, fs] = p.synergy.from;
    const [tb, ts] = p.synergy.to;
    const from = sky.branches[fb]?.stars[fs];
    const to = sky.branches[tb]?.stars[ts];
    if (from && to) {
      const a =
        0.7 *
        Math.min(appear(p.reveal, fb, fs, nB, sky.branches[fb].stars.length + 1), appear(p.reveal, tb, ts, nB, sky.branches[tb].stars.length + 1)) *
        Math.min(branchAlpha(p, fb), branchAlpha(p, tb));
      if (a > 0) {
        ctx.globalAlpha = a;
        ctx.strokeStyle = VIOLET;
        ctx.setLineDash([3, 4]);
        line(P(from), P(to));
        ctx.setLineDash([]);
      }
    }
  }

  // the stars: a soft glow at the star's size (brighter and bigger when hovered or open; the star
  // itself is its icon, in the HTML layer over the canvas); the locked star hollow
  sky.branches.forEach((br, b) => {
    const n = br.stars.length + 1;
    const ba = branchAlpha(p, b);
    const glow = p.glow?.(p.colors[b]) ?? null;
    br.stars.forEach((v, k) => {
      const a = appear(p.reveal, b, k, nB, n) * ba;
      if (a <= 0) return;
      const s = P(v);
      const on = Math.max(p.hover?.b === b && p.hover.s === k ? 1 : 0, p.picked?.b === b && p.picked.s === k ? p.dim : 0);
      const twinkle = p.still ? 1 : 0.9 + 0.1 * Math.sin(p.time * 1.6 + b * 1.3 + k * 2.1);
      const depth = 0.75 + 0.25 * Math.max(-1, Math.min(1, s.depth / 80));
      const r = Math.min(2.2, s.scale) * (br.sizes[k] ?? 1) * (1 + 0.35 * on);
      if (glow) {
        const g = 26 * r;
        ctx.globalAlpha = a * twinkle * depth * (0.75 + 0.25 * on);
        ctx.drawImage(glow, s.x - g / 2, s.y - g / 2, g, g);
      }
    });
    const la = 0.5 * appear(p.reveal, b, n - 1, nB, n) * ba;
    if (la > 0) {
      const s = P(br.locked);
      ctx.globalAlpha = la;
      ctx.strokeStyle = p.colors[b];
      disc(s.x, s.y, 4 * Math.min(2.2, s.scale));
      ctx.stroke();
    }
  });

  // the open star's target reticle
  const pick = p.picked ? sky.branches[p.picked.b]?.stars[p.picked.s] : undefined;
  if (pick && p.dim > 0) {
    const s = P(pick);
    const r = 13 * Math.min(2.2, s.scale);
    ctx.globalAlpha = p.dim;
    ctx.strokeStyle = VIOLET;
    disc(s.x, s.y, r);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const t = (i * TAU) / 4;
      line({ x: s.x + Math.cos(t) * (r + 3), y: s.y + Math.sin(t) * (r + 3) }, { x: s.x + Math.cos(t) * (r + 8), y: s.y + Math.sin(t) * (r + 8) });
    }
  }

  if (pa > 0) drawPlanet(ctx, planet, pa, p);

  if (p.names) {
    ctx.font = "10px ui-monospace, monospace";
    ctx.textBaseline = "middle";
    sky.branches.forEach((br, b) => {
      const a = 0.8 * appear(p.reveal, b, 0, nB, br.stars.length + 1) * branchAlpha(p, b);
      if (a <= 0) return;
      // (at this scale, just outside the constellation as it turns, on the side away from the
      // planet: from its leftmost star, kept inside the canvas)
      const pts = [...br.stars, br.locked].map(P);
      const ys = pts.map((q) => q.y);
      const below = ys.reduce((sum, v) => sum + v, 0) / ys.length > planet.y;
      const text = br.title.toUpperCase();
      const x = Math.min(Math.max(Math.min(...pts.map((q) => q.x)), 8), vp.w - 8 - text.length * 6.2);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.colors[b];
      ctx.fillText(text, x, below ? Math.max(...ys) + 12 : Math.min(...ys) - 12);
    });
  }
  ctx.restore();
}

// the planet: a lavender disc inside a thin tilted ring (back half behind it, front half over it),
// with a glint going round the ring's front once every 40s
function drawPlanet(ctx: CanvasRenderingContext2D, s: Screen, a: number, p: Paint) {
  const r = 11 * Math.min(2.6, s.scale);
  const tilt = -0.35;
  const ring = (from: number, to: number) => {
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, r * 2.1, r * 0.55, tilt, from, to);
    ctx.stroke();
  };
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = LAV;
  ctx.globalAlpha = 0.5 * a;
  ring(Math.PI, TAU);
  const glow = p.glow?.(LAV) ?? null;
  if (glow) {
    const g = r * 7;
    ctx.globalAlpha = 0.6 * a;
    ctx.drawImage(glow, s.x - g / 2, s.y - g / 2, g, g);
  }
  const shade = ctx.createRadialGradient(s.x - r * 0.35, s.y - r * 0.35, r * 0.1, s.x, s.y, r);
  shade.addColorStop(0, "#efeaf8");
  shade.addColorStop(1, "#6e5aa8");
  ctx.globalAlpha = a;
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(s.x, s.y, r, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 0.8 * a;
  ring(0, Math.PI);
  if (!p.still) {
    const t = ((p.time / 40) * TAU) % TAU;
    if (t < Math.PI) {
      const ex = r * 2.1 * Math.cos(t);
      const ey = r * 0.55 * Math.sin(t);
      ctx.globalAlpha = a;
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(s.x + ex * Math.cos(tilt) - ey * Math.sin(tilt), s.y + ex * Math.sin(tilt) + ey * Math.cos(tilt), 1.6, 0, TAU);
      ctx.fill();
    }
  }
  ctx.lineWidth = 1;
}

// a soft round glow in a colour, drawn once per colour and reused
export function makeGlow(doc: Document) {
  const cache = new Map<string, HTMLCanvasElement | null>();
  return (color: string): CanvasImageSource | null => {
    if (cache.has(color)) return cache.get(color) ?? null;
    const c = doc.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    if (g) {
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, `${color}cc`);
      grad.addColorStop(0.3, `${color}44`);
      grad.addColorStop(1, `${color}00`);
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
    }
    cache.set(color, g ? c : null);
    return g ? c : null;
  };
}
