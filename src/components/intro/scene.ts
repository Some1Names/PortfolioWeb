// The loading intro's drawing, as pure functions (no DOM, no React), so the geometry can be
// tested on its own: one seeded pool of points that morphs through the storyboard's beats
// (docs/superpowers/specs/2026-09-28-loading-intro-design.md §1).

export const COLS = 24;
export const ROWS = 16;
export const POOL = COLS * ROWS; // 384
export const DURATION = 7.6;
// beat boundaries, in seconds
export const T = {
  line: 0.25, // the centre dot starts stretching into the measuring line
  grid: 0.8,
  plane: 1.8,
  globe: 2.9,
  network: 4.3,
  collapse: 5.4,
  converge: 5.7,
  mark: 6.0, // the canvas is done; the "Uefa" wordmark takes over
  handover: 7.0,
  end: 7.6,
} as const;

export type Point = {
  col: number; // grid cell
  row: number;
  sx: number; // unit-sphere position (Fibonacci sphere)
  sy: number;
  sz: number;
  nx: number; // network position, -1..1
  ny: number;
  links: number[]; // the 2 nearest network neighbours
};
export type XY = { x: number; y: number; a: number };

const INK = "214, 208, 232"; // off-white with the site's lavender tint
const PINK = "#ff6ad5";
const VIOLET = "#9a6bff";
const PINK_NODE = 200; // the one accent node in the network
const TILT = (64 * Math.PI) / 180;
const FOCAL = 30; // perspective distance, in grid pitches
const PLANE_X = 0.78; // the tilted plane is squeezed so its near edge stays on screen
const SPIN = 0.9; // globe rotation, radians per second

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// 0→1 progress of t through [a, b]
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const mix = (a: number, b: number, p: number) => a + (b - a) * p;

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export function makePool(seed = 7): Point[] {
  const r = seeded(seed);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const pts: Point[] = [];
  for (let i = 0; i < POOL; i++) {
    const sy = 1 - (2 * (i + 0.5)) / POOL;
    const rr = Math.sqrt(1 - sy * sy);
    const th = i * golden;
    pts.push({
      col: i % COLS,
      row: Math.floor(i / COLS),
      sx: Math.cos(th) * rr,
      sy,
      sz: Math.sin(th) * rr,
      nx: r() * 2 - 1,
      ny: r() * 2 - 1,
      links: [],
    });
  }
  for (let i = 0; i < POOL; i++) {
    let a = -1;
    let b = -1;
    let da = Infinity;
    let db = Infinity;
    for (let j = 0; j < POOL; j++) {
      if (j === i) continue;
      const d = (pts[i].nx - pts[j].nx) ** 2 + (pts[i].ny - pts[j].ny) ** 2;
      if (d < da) {
        b = a;
        db = da;
        a = j;
        da = d;
      } else if (d < db) {
        b = j;
        db = d;
      }
    }
    pts[i].links = [a, b];
  }
  return pts;
}

// grid spacing: 48px, smaller when the centred 24 × 16 grid would not fit 90% × 80% of the screen
export const pitch = (w: number, h: number) => Math.min(48, (0.9 * w) / (COLS - 1), (0.8 * h) / (ROWS - 1));
export const sphereR = (w: number, h: number) => 0.24 * Math.min(w, h);
// half the measuring line's length: grows to 30% of the width by the grid beat
export const measureHalf = (t: number, w: number) => 0.3 * w * ease(seg(t, T.line, T.grid));
// "Rendering 000" → "100" by the time the mark appears
export const counterAt = (t: number) => String(Math.round(100 * seg(t, 0, T.mark))).padStart(3, "0");

// a spot on the grid plane (X in columns, Y in rows from the centre), tilted back by `tilt`
function project(X: number, Y: number, w: number, h: number, tilt: number) {
  const k = pitch(w, h);
  const z = -Y * Math.sin(tilt);
  const s = FOCAL / (FOCAL + z);
  return { x: w / 2 + X * mix(1, PLANE_X, tilt / TILT) * k * s, y: h / 2 + Y * Math.cos(tilt) * k * s, s };
}
const planeXY = (p: Point, w: number, h: number, tilt: number) =>
  project(p.col - (COLS - 1) / 2, p.row - (ROWS - 1) / 2, w, h, tilt);
function sphereXY(p: Point, w: number, h: number, rot: number) {
  const R = sphereR(w, h);
  const x = p.sx * Math.cos(rot) + p.sz * Math.sin(rot);
  const z = -p.sx * Math.sin(rot) + p.sz * Math.cos(rot);
  return { x: w / 2 + x * R, y: h / 2 - p.sy * R, depth: z };
}
const networkXY = (p: Point, w: number, h: number) => ({ x: w / 2 + p.nx * 0.36 * w, y: h / 2 + p.ny * 0.3 * h });
const depthAlpha = (depth: number) => 0.35 + 0.55 * ((depth + 1) / 2);

// where point i is at time t, and how visible (0 before it appears, 0 after the collapse)
export function layoutAt(i: number, t: number, w: number, h: number, pool: Point[]): XY {
  const p = pool[i];
  if (t < T.plane) {
    const g = planeXY(p, w, h, 0);
    return { x: g.x, y: g.y, a: 0.8 * seg(t, 1.4, T.plane) };
  }
  if (t < T.globe) {
    const q = planeXY(p, w, h, TILT * ease(seg(t, T.plane, 2.5)));
    return { x: q.x, y: q.y, a: 0.8 };
  }
  const rot = (t - T.globe) * SPIN;
  if (t < T.network) {
    const from = planeXY(p, w, h, TILT);
    const to = sphereXY(p, w, h, rot);
    const m = ease(seg(t, T.globe, 3.5));
    return { x: mix(from.x, to.x, m), y: mix(from.y, to.y, m), a: mix(0.8, depthAlpha(to.depth), m) };
  }
  if (t < T.collapse) {
    const from = sphereXY(p, w, h, rot);
    const to = networkXY(p, w, h);
    const m = ease(seg(t, T.network, 4.8));
    return { x: mix(from.x, to.x, m), y: mix(from.y, to.y, m), a: mix(depthAlpha(from.depth), 0.85, m) };
  }
  const n = networkXY(p, w, h);
  const flat = ease(seg(t, T.collapse, T.converge));
  const conv = ease(seg(t, T.converge, 5.95));
  return { x: mix(n.x, w / 2, conv), y: mix(n.y, h / 2, flat), a: 0.85 * (1 - seg(t, 5.85, T.mark)) };
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function strokePath(ctx: CanvasRenderingContext2D, color: string, path: () => void) {
  ctx.strokeStyle = color;
  ctx.beginPath();
  path();
  ctx.stroke();
}

// paints beats A–F for time t (seconds) into a w × h canvas (CSS pixels; the caller scales for DPR)
export function drawScene(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, pool: Point[]) {
  const cx = w / 2;
  const cy = h / 2;
  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 1;

  // A: a dot, then the measuring line with end ticks (fades as the grid arrives)
  if (t < T.line) {
    dot(ctx, cx, cy, 1.5 * ease(seg(t, 0, T.line)), `rgba(${INK}, 0.9)`);
  } else if (t < 1.2) {
    const half = measureHalf(t, w);
    strokePath(ctx, `rgba(${INK}, ${0.9 * (1 - seg(t, T.grid, 1.2))})`, () => {
      ctx.moveTo(cx - half, cy);
      ctx.lineTo(cx + half, cy);
      ctx.moveTo(cx - half, cy - 4);
      ctx.lineTo(cx - half, cy + 4);
      ctx.moveTo(cx + half, cy - 4);
      ctx.lineTo(cx + half, cy + 4);
    });
  }

  // B: grid lines grow out of the line, aligned with the point pool; they fade as the plane tilts
  if (t >= T.grid && t < 2.1) {
    const k = pitch(w, h);
    const v = ease(seg(t, T.grid, 1.3));
    const hz = ease(seg(t, 1.1, 1.6));
    strokePath(ctx, `rgba(${INK}, ${0.18 * (1 - seg(t, T.plane, 2.1))})`, () => {
      for (let c = -Math.ceil(cx / k); c <= Math.ceil(cx / k); c++) {
        const x = cx + (c + 0.5) * k;
        ctx.moveTo(x, cy - cy * v);
        ctx.lineTo(x, cy + cy * v);
      }
      if (hz > 0) {
        for (let r = -Math.ceil(cy / k); r <= Math.ceil(cy / k); r++) {
          const y = cy + (r + 0.5) * k;
          ctx.moveTo(cx - cx * hz, y);
          ctx.lineTo(cx + cx * hz, y);
        }
      }
    });
  }

  // C: a ring gliding across the tilted plane's middle row
  if (t >= 2.2 && t < T.globe) {
    const q = project(mix(-9, 9, ease(seg(t, 2.2, T.globe))), 0, w, h, TILT);
    ctx.strokeStyle = `rgba(${INK}, ${0.8 * (1 - seg(t, 2.75, T.globe))})`;
    ctx.beginPath();
    ctx.arc(q.x, q.y, 18 * q.s, 0, Math.PI * 2);
    ctx.stroke();
  }

  // D: orbit ellipse (dotted) and crosshairs around the globe
  if (t >= 3.3 && t < T.network + 0.3) {
    const R = sphereR(w, h);
    const a = 0.6 * seg(t, 3.3, 3.7) * (1 - seg(t, T.network, T.network + 0.3));
    ctx.save();
    ctx.setLineDash([2, 4]);
    strokePath(ctx, `rgba(${INK}, ${a})`, () => ctx.ellipse(cx, cy, 1.6 * R, 0.35 * R, (-12 * Math.PI) / 180, 0, Math.PI * 2));
    ctx.restore();
    strokePath(ctx, `rgba(${INK}, ${a * 0.6})`, () => {
      ctx.moveTo(cx - 1.2 * R, cy);
      ctx.lineTo(cx + 1.2 * R, cy);
      ctx.moveTo(cx, cy - 1.2 * R);
      ctx.lineTo(cx, cy + 1.2 * R);
    });
  }

  // E: links between each point and its 2 nearest neighbours
  if (t >= 4.7 && t < 5.5) {
    const a = 0.35 * seg(t, 4.7, 5.1) * (1 - seg(t, T.collapse, 5.5));
    strokePath(ctx, `rgba(${INK}, ${a})`, () => {
      for (let i = 0; i < POOL; i++) {
        const p = layoutAt(i, t, w, h, pool);
        for (const j of pool[i].links) {
          const q = layoutAt(j, t, w, h, pool);
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
        }
      }
    });
  }

  // the points themselves (B–F); one pink node during the network
  if (t >= 1.4 && t < T.mark) {
    for (let i = 0; i < POOL; i++) {
      const p = layoutAt(i, t, w, h, pool);
      if (p.a <= 0) continue;
      const accent = i === PINK_NODE && t >= 4.8 && t < T.collapse;
      dot(ctx, p.x, p.y, accent ? 2 : 1, accent ? PINK : `rgba(${INK}, ${p.a})`);
    }
  }

  // F: everything converges into one violet dot, which hands over to the wordmark
  if (t >= 5.85 && t < 6.1) {
    ctx.globalAlpha = seg(t, 5.85, T.mark) * (1 - seg(t, T.mark, 6.1));
    dot(ctx, cx, cy, 2.5, VIOLET);
    ctx.globalAlpha = 1;
  }
}
