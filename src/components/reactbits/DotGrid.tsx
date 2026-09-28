"use client";

/*
 * DotGrid — based on React Bits by David Haz (https://reactbits.dev), MIT + Commons Clause.
 * Rebuilt for this site as a section background:
 * - the dots live in the section's coordinates, but the canvas is only about two screens tall: it
 *   scrolls with the page and jumps ahead (and redraws) when the screen nears one of its edges,
 *   so a long section doesn't need a canvas of tens of megapixels, and native (touch) scrolling
 *   can't make the dots judder;
 * - it draws on the GSAP ticker (after Lenis), only while the section is near the screen and only
 *   when something changed;
 * - each dot's active colour comes from where it sits across the width: pink, violet, blue;
 * - the grid fades out at the section's top and bottom;
 * - only a mouse lights up and pushes the dots; a click or tap in the section sends a shockwave;
 * - reduced motion: a still grid that ignores the pointer.
 */
import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import styles from "./DotGrid.module.css";

if (typeof window !== "undefined") gsap.registerPlugin(InertiaPlugin);

type RGB = [number, number, number];
const hexToRgb = (hex: string): RGB => {
  const c = hex.replace("#", "");
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
};
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
// a colour along evenly spaced stops, t from 0 to 1
const along = (stops: RGB[], t: number): RGB => {
  const f = Math.min(Math.max(t, 0), 1) * (stops.length - 1);
  const i = Math.min(Math.floor(f), stops.length - 2);
  return mix(stops[i], stops[i + 1], f - i);
};
const TAU = Math.PI * 2;

interface Dot {
  cx: number; // rest position, in the section's coordinates
  cy: number;
  ox: number; // current push away from it
  oy: number;
  busy: boolean; // being thrown (it can be thrown again while springing back)
}

interface DotGridProps {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColors?: string[]; // across the width, left to right
  proximity?: number; // px around the cursor that light up and get pushed
  speedTrigger?: number; // px/s the mouse must move to push
  shockRadius?: number;
  shockStrength?: number;
  maxSpeed?: number;
  resistance?: number;
  returnDuration?: number;
  fade?: number; // px over which the grid fades in at the top and out at the bottom
  className?: string;
}

export default function DotGrid({
  dotSize = 3,
  gap = 21,
  baseColor = "#2c2a36",
  activeColors = ["#ff6ad5", "#9a6bff", "#5c8aff"],
  proximity = 140,
  speedTrigger = 100,
  shockRadius = 240,
  shockStrength = 4,
  maxSpeed = 5000,
  resistance = 750,
  returnDuration = 1.5,
  fade = 160,
  className = "",
}: DotGridProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorsKey = activeColors.join();

  useEffect(() => {
    const layer = layerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!layer || !canvas || !ctx) return;
    const still = prefersReducedMotion();
    const base = hexToRgb(baseColor);
    const stops = colorsKey.split(",").map(hexToRgb);
    const cell = dotSize + gap;
    const rad = dotSize / 2;
    const proxSq = proximity * proximity;

    let dots: Dot[] = [];
    let tints: RGB[] = []; // per column
    let cols = 0;
    let rows = 0;
    let startX = 0;
    let startY = 0;
    let width = 0; // the section
    let height = 0;
    let dpr = 1;
    let canvasH = 0;
    let top = 0; // where the canvas sits in the section
    let dirty = true;
    let lastLeft = NaN;
    let lastTop = NaN;
    const moving = new Set<Dot>();
    const pointer = { x: 0, y: 0, t: 0, on: false };

    // the grid, for the section's size (again whenever that changes)
    const build = () => {
      if (layer.clientWidth === width && layer.clientHeight === height) return;
      dots.forEach((d) => gsap.killTweensOf(d));
      moving.clear();
      width = layer.clientWidth;
      height = layer.clientHeight;
      // centred across, but hung from the top edge: when the section grows (images and fonts
      // loading) rows are added at the bottom instead of every dot shifting
      cols = Math.max(0, Math.floor((width + gap) / cell));
      startX = (width - (cols * cell - gap)) / 2 + rad;
      startY = gap / 2 + rad;
      rows = Math.max(0, Math.floor((height - startY) / cell) + 1);
      dots = [];
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          dots.push({ cx: startX + c * cell, cy: startY + r * cell, ox: 0, oy: 0, busy: false });
      tints = Array.from({ length: cols }, (_, c) => along(stops, width ? (startX + c * cell) / width : 0));
      size();
    };
    // the canvas, for the section's width and the screen's height (on phones that changes as the
    // address bar shows and hides; the dots keep their springs)
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvasH = Math.min(height, Math.round(window.innerHeight * 2));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(canvasH * dpr);
      canvas.style.height = `${canvasH}px`;
      top = NaN; // placed on the next tick
      dirty = true;
    };

    // the dots within `radius` of (x, y), in the section's coordinates
    const near = (x: number, y: number, radius: number, fn: (d: Dot, dist: number) => void) => {
      const c0 = Math.max(0, Math.floor((x - radius - startX) / cell));
      const c1 = Math.min(cols - 1, Math.ceil((x + radius - startX) / cell));
      const r0 = Math.max(0, Math.floor((y - radius - startY) / cell));
      const r1 = Math.min(rows - 1, Math.ceil((y + radius - startY) / cell));
      for (let r = r0; r <= r1; r++)
        for (let c = c0; c <= c1; c++) {
          const d = dots[r * cols + c];
          const dist = Math.hypot(d.cx - x, d.cy - y);
          if (dist < radius) fn(d, dist);
        }
    };

    const push = (d: Dot, vx: number, vy: number) => {
      d.busy = true;
      moving.add(d);
      gsap.killTweensOf(d);
      gsap.to(d, {
        inertia: { ox: vx, oy: vy, resistance },
        onComplete: () => {
          d.busy = false;
          gsap.to(d, {
            ox: 0,
            oy: 0,
            duration: returnDuration,
            ease: "elastic.out(1,0.75)",
            // (GSAP renders this last frame before our tick, so ask for one more draw)
            onComplete: () => {
              moving.delete(d);
              dirty = true;
            },
          });
        },
      });
    };

    const lit: number[] = [];
    const draw = (lr: DOMRect) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, canvasH);
      const px = pointer.on ? pointer.x - lr.left : -1e6;
      const py = pointer.on ? pointer.y - lr.top : -1e6;
      const pad = cell * 3; // pushed dots can travel in from just outside
      const r0 = Math.max(0, Math.floor((top - pad - startY) / cell));
      const r1 = Math.min(rows - 1, Math.ceil((top + canvasH + pad - startY) / cell));
      for (let r = r0; r <= r1; r++) {
        const rowY = startY + r * cell;
        const alpha = Math.min(1, rowY / fade, (height - rowY) / fade);
        if (alpha <= 0) continue;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        lit.length = 0;
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const d = dots[i];
          const dx = d.cx - px;
          const dy = d.cy - py;
          if (dx * dx + dy * dy < proxSq) {
            lit.push(i);
            continue;
          }
          const x = d.cx + d.ox;
          const y = d.cy + d.oy - top;
          ctx.moveTo(x + rad, y);
          ctx.arc(x, y, rad, 0, TAU);
        }
        ctx.fill();
        for (const i of lit) {
          const d = dots[i];
          // (a quadratic falloff lights more of the patch than a linear one; lit dots swell a little)
          const q = ((d.cx - px) ** 2 + (d.cy - py) ** 2) / proxSq;
          const t = 1 - q;
          const [cr, cg, cb] = mix(base, tints[i % cols], t);
          ctx.fillStyle = `rgb(${Math.round(cr)},${Math.round(cg)},${Math.round(cb)})`;
          ctx.beginPath();
          ctx.arc(d.cx + d.ox, d.cy + d.oy - top, rad * (1 + 0.6 * t), 0, TAU);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    const tick = () => {
      const lr = layer.getBoundingClientRect();
      // keep the screen inside the canvas: when it gets within half a margin of an edge of the
      // canvas (one that isn't the section's own edge), move the canvas to centre it again
      const margin = (canvasH - window.innerHeight) / 2;
      const screenTop = -lr.top;
      const screenBottom = screenTop + window.innerHeight;
      const nearTop = top > 0 && screenTop - top < margin / 2;
      const nearBottom = top + canvasH < height && top + canvasH - screenBottom < margin / 2;
      if (Number.isNaN(top) || nearTop || nearBottom) {
        top = Math.round(Math.min(Math.max(screenTop - margin, 0), height - canvasH));
        canvas.style.transform = `translateY(${top}px)`;
        dirty = true;
      }
      // the lit patch follows the cursor through the section as the page scrolls under it
      if (pointer.on && (lr.left !== lastLeft || lr.top !== lastTop)) dirty = true;
      lastLeft = lr.left;
      lastTop = lr.top;
      if (!dirty && moving.size === 0) return;
      dirty = false;
      draw(lr);
    };

    // tick only while the section is near the screen (added from the observer, so after Lenis's
    // own ticker callback: the dots are drawn from this frame's scroll position)
    let ticking = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !ticking) {
          ticking = true;
          dirty = true;
          gsap.ticker.add(tick);
        } else if (!entry.isIntersecting && ticking) {
          ticking = false;
          gsap.ticker.remove(tick);
        }
      },
      { rootMargin: "25% 0px" },
    );

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const now = performance.now();
      const dt = Math.max(1, now - pointer.t);
      let vx = pointer.t ? ((e.clientX - pointer.x) / dt) * 1000 : 0;
      let vy = pointer.t ? ((e.clientY - pointer.y) / dt) * 1000 : 0;
      let speed = Math.hypot(vx, vy);
      if (speed > maxSpeed) {
        vx *= maxSpeed / speed;
        vy *= maxSpeed / speed;
        speed = maxSpeed;
      }
      Object.assign(pointer, { x: e.clientX, y: e.clientY, t: now, on: true });
      dirty = true;
      if (!ticking || speed < speedTrigger) return;
      const lr = layer.getBoundingClientRect();
      const x = e.clientX - lr.left;
      const y = e.clientY - lr.top;
      near(x, y, proximity, (d) => {
        if (!d.busy) push(d, d.cx - x + vx * 0.005, d.cy - y + vy * 0.005);
      });
    };
    // the mouse left the window
    const onOut = (e: MouseEvent) => {
      if (e.relatedTarget) return;
      pointer.on = false;
      pointer.t = 0;
      dirty = true;
    };
    const onClick = (e: MouseEvent) => {
      if (!ticking || e.detail === 0) return; // (detail 0: a click from the keyboard)
      const lr = layer.getBoundingClientRect();
      const x = e.clientX - lr.left;
      const y = e.clientY - lr.top;
      if (x < 0 || y < 0 || x > lr.width || y > lr.height) return;
      near(x, y, shockRadius, (d, dist) => {
        if (d.busy) return;
        const f = 1 - dist / shockRadius;
        push(d, (d.cx - x) * shockStrength * f, (d.cy - y) * shockStrength * f);
      });
    };

    build();
    const ro = new ResizeObserver(build);
    ro.observe(layer);
    window.addEventListener("resize", size);
    io.observe(layer);
    if (!still) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("mouseout", onOut);
      window.addEventListener("click", onClick);
    }

    return () => {
      ro.disconnect();
      io.disconnect();
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", size);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("mouseout", onOut);
      window.removeEventListener("click", onClick);
      dots.forEach((d) => gsap.killTweensOf(d));
    };
  }, [
    dotSize,
    gap,
    baseColor,
    colorsKey,
    proximity,
    speedTrigger,
    shockRadius,
    shockStrength,
    maxSpeed,
    resistance,
    returnDuration,
    fade,
  ]);

  return (
    <div ref={layerRef} className={`${styles.layer} ${className}`} data-part="dotgrid" aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
