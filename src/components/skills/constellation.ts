// The skill constellation: its geometry (and, from Task 2, its drawing) as plain functions with no
// React and no DOM of their own, so the Node tests can run them
// (docs/superpowers/specs/2026-09-30-skill-constellation-design.md §3).
//
// World space is in "overview pixels" for a 1240 × 600 board: x right, y up, z toward the viewer.
// A camera Pose orbits a target point and scales the world onto the real board.

// ---------- types and constants ----------
export type Vec3 = { x: number; y: number; z: number };
export type BranchShape = { title: string; skills: string[]; items: number };
export type SkyBranch = {
  title: string;
  names: string[]; // the skills' names, in learning order
  stars: Vec3[]; // one per skill
  locked: Vec3; // the hollow next-quest star at the end of the chain
  items: Vec3[]; // faint item dots
  name: Vec3; // where the constellation's name sits
};
export type Sky = { planet: Vec3; branches: SkyBranch[]; field: Vec3[][] };
export type Pose = { tx: number; ty: number; tz: number; yaw: number; pitch: number; zoom: number };
export type Viewport = { w: number; h: number };
export type Screen = { x: number; y: number; scale: number; depth: number };
export type Side = "left" | "right";

export const WORLD = { w: 1240, h: 600 };
export const FOCAL = 1400; // perspective distance, in world px
export const CARD_W = 320; // the HUD card's width
export const EDGE = 24; // the clear margin at the board's edges and beside the card
export const LABEL_H = 18; // a skill label's line height

// Each branch's chain, in data order (Frontend above, Motion & 3D right, Data below, Design left):
// its first star, the step to the next (shrunk if the chain would outgrow `span`), its depth, and
// the box its item dots scatter in (x, y = bottom-left corner).
const CHAINS = [
  { start: { x: -380, y: 200 }, step: { x: 150, y: 0 }, span: 600, z: -60, items: { x: -380, y: 250, w: 600, h: 30 } },
  { start: { x: 380, y: 125 }, step: { x: 0, y: -62 }, span: 310, z: 40, items: { x: 360, y: -215, w: 70, h: 45 } },
  { start: { x: -380, y: -200 }, step: { x: 150, y: 0 }, span: 600, z: -20, items: { x: -380, y: -280, w: 600, h: 30 } },
  { start: { x: -520, y: 140 }, step: { x: 0, y: -62 }, span: 310, z: 60, items: { x: -600, y: -150, w: 40, h: 300 } },
];
// the background starfield: three layers, deeper ones drifting less as the camera moves
const FIELD = [
  { n: 90, z: -380 },
  { n: 60, z: -240 },
  { n: 40, z: -120 },
];

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

// ---------- the HTML labels' sizes (the framing must leave room for them) ----------
// skill labels are 13px, 12px on boards under 1000px wide
export const labelPx = (vp: Viewport) => (vp.w < 1000 ? 12 : 13);
// a skill label's reach from its star: a 14px gap, then ~0.57em a character
export const labelW = (name: string, px = 13) => 14 + name.length * px * 0.57;
// labels grow and shrink a little with depth
export const labelScale = (scale: number) => Math.min(1.1, Math.max(0.9, scale));
// a constellation name's width: 10px mono capitals with 1.5px tracking
export const nameW = (title: string) => title.length * 7.6;

// ---------- layout ----------
export function layoutSky(shapes: BranchShape[], seed = 11): Sky {
  const r = seeded(seed);
  const j = (a: number) => (r() * 2 - 1) * a;
  const branches = shapes.map((shape, b): SkyBranch => {
    const c = CHAINS[b % CHAINS.length];
    const horizontal = c.step.y === 0;
    const n = shape.skills.length; // steps from the first star to the locked one
    const k = Math.min(1, c.span / (Math.max(n, 1) * Math.hypot(c.step.x, c.step.y)));
    // the chain, gently zig-zagged across its direction
    const at = (i: number): Vec3 => ({
      x: c.start.x + c.step.x * k * i + (horizontal ? j(6) : j(16)),
      y: c.start.y + c.step.y * k * i + (horizontal ? j(16) : j(5)),
      z: c.z + j(18),
    });
    const stars = shape.skills.map((_, i) => at(i));
    const locked = at(n);
    const items = Array.from({ length: shape.items }, () => ({
      x: c.items.x + r() * c.items.w,
      y: c.items.y + r() * c.items.h,
      z: c.z + j(10),
    }));
    const first = stars[0] ?? locked;
    const name = { x: first.x - 6, y: first.y + (horizontal ? 36 : 34), z: first.z };
    return { title: shape.title, names: shape.skills, stars, locked, items, name };
  });
  const field = FIELD.map((l) => Array.from({ length: l.n }, () => ({ x: j(900), y: j(520), z: l.z + j(30) })));
  return { planet: { x: 0, y: 0, z: 0 }, branches, field };
}

// ---------- camera ----------
export const fit = (vp: Viewport) => Math.min(vp.w / WORLD.w, vp.h / WORLD.h);

// a world point → the board, for a camera pose: turned by yaw (about the vertical) and pitch (about
// the horizontal) around the target, then in perspective (nearer = bigger)
export function project(p: Vec3, cam: Pose, vp: Viewport): Screen {
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
  const k = fit(vp) * cam.zoom * persp;
  return { x: vp.w / 2 + x * k, y: vp.h / 2 - y * k, scale: cam.zoom * persp, depth: z };
}

export const overviewPose = (): Pose => ({ tx: 0, ty: 0, tz: 0, yaw: 0, pitch: 0, zoom: 1 });

// the card goes on the side away from what it's about
export const cardSide = (x: number, vp: Viewport): Side => (x < vp.w / 2 ? "right" : "left");

// the pose that frames branch b in the space beside the card, and the card's side
export function branchPose(sky: Sky, b: number, vp: Viewport): { pose: Pose; side: Side } {
  const br = sky.branches[b];
  const px = labelPx(vp);
  const centreX = br.stars.reduce((sum, p) => sum + project(p, overviewPose(), vp).x, 0) / Math.max(br.stars.length, 1);
  const side = cardSide(centreX, vp);
  const free = { w: vp.w - CARD_W - EDGE * 3, h: vp.h - EDGE * 2 };
  const freeCx = side === "right" ? EDGE + free.w / 2 : vp.w - EDGE - free.w / 2;
  // what reaches left and right of each point, in px: labels at their largest, else a star's glow
  const parts = [
    ...br.stars.map((p, i) => ({ p, l: 12, r: 1.1 * labelW(br.names[i], px) })),
    { p: br.locked, l: 12, r: 12 },
    ...br.items.map((p) => ({ p, l: 9, r: 9 })),
    { p: br.name, l: 0, r: nameW(br.title) },
  ];
  const ys = parts.map((q) => q.p.y);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  const left = (k: number) => Math.min(...parts.map((q) => q.p.x * k - q.l));
  const right = (k: number) => Math.max(...parts.map((q) => q.p.x * k + q.r));
  const fits = (k: number) => right(k) - left(k) <= free.w && (y1 - y0) * k + LABEL_H * 2 <= free.h;
  // the biggest scale (world px → board px) that fits, with a little air
  let lo = 0.1;
  let hi = fit(vp) * 1.8;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (fits(m)) lo = m;
    else hi = m;
  }
  const k = lo * 0.94;
  const tz = br.stars.reduce((sum, p) => sum + p.z, 0) / Math.max(br.stars.length, 1);
  return {
    side,
    pose: {
      // aim so the framed box's middle lands in the middle of the free space
      tx: ((left(k) + right(k)) / 2 + vp.w / 2 - freeCx) / k,
      ty: (y0 + y1) / 2,
      tz,
      yaw: side === "right" ? 0.06 : -0.06, // turned a touch toward the card
      pitch: 0,
      zoom: k / fit(vp),
    },
  };
}

// the pose that brings the planet up close, left of the card
export function planetPose(vp: Viewport): { pose: Pose; side: Side } {
  const free = vp.w - CARD_W - EDGE * 3;
  const freeCx = EDGE + free / 2;
  const zoom = 2.4;
  const k = fit(vp) * zoom;
  return { side: "right", pose: { tx: -(freeCx - vp.w / 2) / k, ty: 0, tz: 0, yaw: 0.08, pitch: -0.05, zoom } };
}
