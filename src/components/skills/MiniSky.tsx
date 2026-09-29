"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { branches, synergy } from "@/data/skills";
import { drawSky, makeGlow, miniPose, type Viewport } from "./constellation";
import { getSky } from "./sky";
import styles from "./Constellation.module.css";

const HEX = { art: "#ff6ad5", web: "#5c8aff", collide: "#9a6bff" } as const; // --art, --web, --collide
const COLORS = branches.map((b) => HEX[b.side]);

// The phones' small, decorative sky above the skills list: the four constellations and the planet,
// turning once a minute, their names only. Still for reduced motion; drawn only while on screen.
export default function MiniSky() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = root.current;
    const cv = canvas.current;
    const maybe = cv?.getContext("2d");
    if (!el || !cv || !maybe) return;
    const ctx: CanvasRenderingContext2D = maybe;
    const SKY = getSky();
    const still = prefersReducedMotion();
    const glow = makeGlow(document);
    const t0 = performance.now();
    let vp: Viewport = { w: 1, h: 1 };
    let dpr = 1;
    let visible = false;
    let running = false;

    const draw = () => {
      const time = (performance.now() - t0) / 1000;
      const pose = miniPose(still ? 0.25 : (time / 60) * Math.PI * 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, vp.w, vp.h);
      drawSky(ctx, { sky: SKY, pose, vp, colors: COLORS, reveal: 1, dim: 0, focus: -2, hover: null, picked: null, time, still, synergy, glow, names: true });
    };
    const setRunning = (on: boolean) => {
      if (on === running) return;
      running = on;
      el.dataset.running = String(on);
      if (on && !still) gsap.ticker.add(draw);
      else gsap.ticker.remove(draw);
    };
    const update = () => setRunning(visible && document.visibilityState === "visible");
    const size = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      vp = { w, h };
      draw();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) draw();
      update();
    });
    const ro = new ResizeObserver(size);
    size();
    ro.observe(el);
    io.observe(el);
    window.addEventListener("resize", size);
    document.addEventListener("visibilitychange", update);
    return () => {
      ro.disconnect();
      io.disconnect();
      gsap.ticker.remove(draw);
      window.removeEventListener("resize", size);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <div ref={root} className={styles.mini} data-part="mini-sky" aria-hidden="true">
      <canvas ref={canvas} />
    </div>
  );
}
