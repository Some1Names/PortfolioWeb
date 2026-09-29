"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { branches, synergy } from "@/data/skills";
import {
  appear,
  appearPlanet,
  branchAlpha,
  branchPose,
  drawSky,
  labelPx,
  labelScale,
  layoutSky,
  makeGlow,
  overviewPose,
  planetPose,
  project,
  type Paint,
  type Pose,
  type Side,
  type Vec3,
  type Viewport,
} from "./constellation";
import SkyCard, { type CardView } from "./SkyCard";
import styles from "./Constellation.module.css";

// 04 — the Skills section's star map, on 901px and up
// (docs/superpowers/specs/2026-09-30-skill-constellation-design.md). A 2D canvas draws the sky from
// the pure geometry in constellation.ts; an HTML layer on top holds the real buttons and labels,
// moved to their projected spots every frame. Clicking a star flies the camera (a GSAP tween of the
// pose) to its constellation and opens the HUD card; the planet opens the player card; Esc, the ✕
// or empty sky come back out. It draws only while on screen, and holds still for reduced motion.

const HEX = { art: "#ff6ad5", web: "#5c8aff", collide: "#9a6bff" } as const; // --art, --web, --collide
const SIDE = { art: styles.sideArt, web: styles.sideWeb, collide: styles.sideCollide };
const COLORS = branches.map((b) => HEX[b.side]);
const SKY = layoutSky(branches.map((b) => ({ title: b.name, skills: b.skills.map((s) => s.name), items: b.items.length })));
const N = branches.length;

type Star = { b: number; s: number };
type Api = { open: (view: CardView, from: HTMLElement) => void; close: () => void; hover: (star: Star | null) => void };

export default function ConstellationMap({ onUnavailable }: { onUnavailable?: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cardEl = useRef<HTMLDivElement>(null);
  const leader = useRef<SVGLineElement>(null);
  const planetEl = useRef<HTMLButtonElement>(null);
  const synEl = useRef<HTMLSpanElement>(null);
  const starEls = useRef<(HTMLButtonElement | null)[][]>(branches.map(() => []));
  const lockedEls = useRef<(HTMLSpanElement | null)[]>([]);
  const itemEls = useRef<(HTMLSpanElement | null)[][]>(branches.map(() => []));
  const nameEls = useRef<(HTMLSpanElement | null)[]>([]);
  const api = useRef<Api | null>(null);
  const unavailable = useRef(onUnavailable);
  // what the card shows (kept while it slides out), whether it's open, and its side
  const [card, setCard] = useState<{ view: CardView | null; open: boolean; side: Side }>({ view: null, open: false, side: "right" });

  useEffect(() => {
    unavailable.current = onUnavailable;
  }, [onUnavailable]);

  useEffect(() => {
    const el = root.current;
    const cv = canvas.current;
    const maybe = cv?.getContext("2d");
    if (!el || !cv || !maybe) {
      unavailable.current?.();
      return;
    }
    const ctx: CanvasRenderingContext2D = maybe;
    const still = prefersReducedMotion();
    const glow = makeGlow(document);
    const t0 = performance.now();
    const st = {
      vp: { w: 1, h: 1 } as Viewport,
      dpr: 1,
      cam: overviewPose(),
      focus: -2, // what's open: a branch, -1 = the planet, -2 = nothing (the full map)
      lit: -2, // what stays bright while the rest fades (it outlives `focus` through the fade back)
      picked: null as Star | null,
      hover: null as Star | null,
      side: "right" as Side,
      dim: 0,
      reveal: still ? 1 : 0,
      tilt: { x: 0, y: 0, tx: 0, ty: 0 },
      visible: false,
      running: false,
      entered: still,
      dirty: true,
      opener: null as HTMLElement | null,
    };
    const poseFor = (focus: number) => (focus === -1 ? planetPose(st.vp) : branchPose(SKY, focus, st.vp));

    const place = (node: HTMLElement | null, x: number, y: number, alpha: number, scale = 1) => {
      if (!node) return;
      node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
      node.style.opacity = alpha.toFixed(3);
      node.style.visibility = alpha < 0.03 ? "hidden" : "visible";
    };

    const draw = () => {
      const time = (performance.now() - t0) / 1000;
      if (!still) {
        st.tilt.x += (st.tilt.tx - st.tilt.x) * 0.08;
        st.tilt.y += (st.tilt.ty - st.tilt.y) * 0.08;
      }
      // a slow sway (±4°, 24s) and a tilt toward the mouse (±6°)
      const drift = still ? 0 : 0.07 * Math.sin((time / 24) * Math.PI * 2);
      const pose: Pose = { ...st.cam, yaw: st.cam.yaw + drift + st.tilt.x * 0.105, pitch: st.cam.pitch + st.tilt.y * 0.105 };
      const paint: Paint = {
        sky: SKY,
        pose,
        vp: st.vp,
        colors: COLORS,
        reveal: st.reveal,
        dim: st.dim,
        focus: st.lit,
        hover: st.hover,
        picked: st.picked,
        time,
        still,
        synergy,
        glow,
      };
      ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
      ctx.clearRect(0, 0, st.vp.w, st.vp.h);
      drawSky(ctx, paint);

      // the HTML layer follows the drawing
      const P = (v: Vec3) => project(v, pose, st.vp);
      const pl = P(SKY.planet);
      place(planetEl.current, pl.x, pl.y, appearPlanet(st.reveal));
      SKY.branches.forEach((br, b) => {
        const n = br.stars.length + 1;
        const ba = branchAlpha(paint, b);
        br.stars.forEach((v, k) => {
          const s = P(v);
          place(starEls.current[b][k], s.x, s.y, appear(st.reveal, b, k, N, n) * ba, labelScale(s.scale));
        });
        const last = appear(st.reveal, b, n - 1, N, n) * ba;
        const l = P(br.locked);
        place(lockedEls.current[b], l.x, l.y, last);
        br.items.forEach((v, i) => {
          const s = P(v);
          const node = itemEls.current[b][i];
          place(node, s.x, s.y, last);
          // tooltips open away from the nearer edge
          const below = s.y < st.vp.h / 2 ? "1" : "";
          if (node && node.dataset.below !== below) node.dataset.below = below;
        });
        const nm = P(br.name);
        place(nameEls.current[b], nm.x, nm.y, appear(st.reveal, b, 0, N, n) * ba);
      });
      const [fb, fs] = synergy.from;
      const [tb, ts] = synergy.to;
      const sa = P(SKY.branches[fb].stars[fs]);
      const sb = P(SKY.branches[tb].stars[ts]);
      place(
        synEl.current,
        (sa.x + sb.x) / 2,
        (sa.y + sb.y) / 2,
        Math.min(appear(st.reveal, fb, fs, N, SKY.branches[fb].stars.length + 1), appear(st.reveal, tb, ts, N, SKY.branches[tb].stars.length + 1)) *
          Math.min(branchAlpha(paint, fb), branchAlpha(paint, tb)),
      );

      // the leader line: from the open star (or the planet) to the card's near edge
      const line = leader.current;
      const cardNode = cardEl.current;
      if (line && cardNode) {
        const from = st.picked ? P(SKY.branches[st.picked.b].stars[st.picked.s]) : st.lit === -1 ? pl : null;
        if (from && st.dim > 0.05) {
          const r = cardNode.getBoundingClientRect();
          const o = el.getBoundingClientRect();
          const x2 = st.side === "right" ? r.left - o.left : r.right - o.left;
          const y2 = Math.min(Math.max(from.y, r.top - o.top + 24), r.bottom - o.top - 24);
          line.setAttribute("x1", from.x.toFixed(1));
          line.setAttribute("y1", from.y.toFixed(1));
          line.setAttribute("x2", x2.toFixed(1));
          line.setAttribute("y2", y2.toFixed(1));
          line.style.opacity = st.dim.toFixed(3);
        } else line.style.opacity = "0";
      }
    };

    const tick = () => {
      if (still && !st.dirty) return;
      st.dirty = false;
      draw();
    };
    const setRunning = (on: boolean) => {
      if (on === st.running) return;
      st.running = on;
      el.dataset.running = String(on);
      if (on) gsap.ticker.add(tick);
      else gsap.ticker.remove(tick);
    };
    const update = () => setRunning(st.visible && document.visibilityState === "visible");

    const size = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      st.dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(w * st.dpr);
      cv.height = Math.round(h * st.dpr);
      st.vp = { w, h };
      el.toggleAttribute("data-small", labelPx(st.vp) < 13);
      // an open constellation stays framed for the new size
      if (st.focus !== -2) {
        gsap.killTweensOf(st.cam);
        Object.assign(st.cam, poseFor(st.focus).pose);
      }
      st.dirty = true;
    };

    const fly = (pose: Pose, dim: number) => {
      gsap.killTweensOf(st.cam);
      gsap.killTweensOf(st, "dim");
      if (still) {
        Object.assign(st.cam, pose);
        st.dim = dim;
      } else {
        gsap.to(st.cam, { ...pose, duration: 1.1, ease: "power3.inOut" });
        gsap.to(st, { dim, duration: 0.8, ease: "power2.out" });
      }
      st.dirty = true;
    };
    const open = (view: CardView, from: HTMLElement) => {
      st.opener = from;
      const focus = view.kind === "planet" ? -1 : view.b;
      const { pose, side } = poseFor(focus);
      st.picked = view.kind === "skill" ? { b: view.b, s: view.s } : null;
      st.side = side;
      if (focus !== st.focus) fly(pose, 1);
      st.focus = focus;
      st.lit = focus;
      st.dirty = true;
      el.dataset.view = focus === -1 ? "planet" : `branch-${focus}`;
      setCard({ view, open: true, side });
    };
    const close = () => {
      if (st.focus === -2) return;
      st.focus = -2;
      fly(overviewPose(), 0);
      el.dataset.view = "overview";
      setCard((c) => ({ ...c, open: false }));
      st.opener?.focus({ preventScroll: true });
    };
    api.current = {
      open,
      close,
      hover: (star) => {
        st.hover = star;
        st.dirty = true;
      },
    };

    const io = new IntersectionObserver(([entry]) => {
      st.visible = entry.isIntersecting;
      if (st.visible && !st.entered) {
        st.entered = true;
        gsap.to(st, { reveal: 1, duration: 1.6, ease: "none" });
      }
      st.dirty = true;
      update();
    });
    const onMove = (e: PointerEvent) => {
      if (still || e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      st.tilt.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      st.tilt.ty = -((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onLeave = () => {
      st.tilt.tx = 0;
      st.tilt.ty = 0;
    };
    const onClick = (e: MouseEvent) => {
      if (e.target === cv || e.target === el) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const ro = new ResizeObserver(size);
    el.dataset.view = "overview";
    el.dataset.running = "false";
    size();
    ro.observe(el);
    io.observe(el);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("click", onClick);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", size);
    document.addEventListener("visibilitychange", update);
    return () => {
      ro.disconnect();
      io.disconnect();
      gsap.ticker.remove(tick);
      gsap.killTweensOf(st.cam);
      gsap.killTweensOf(st);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", size);
      document.removeEventListener("visibilitychange", update);
      api.current = null;
    };
  }, []);

  const view = card.open ? card.view : null;
  return (
    <div ref={root} className={styles.map} data-part="sky">
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
      <svg className={styles.leader} aria-hidden="true">
        <line ref={leader} />
      </svg>
      <div className={styles.layer}>
        <button
          ref={planetEl}
          type="button"
          data-part="planet"
          className={styles.planet}
          aria-label="Origin — open the player card"
          aria-pressed={view?.kind === "planet"}
          onClick={(e) => api.current?.open({ kind: "planet" }, e.currentTarget)}
        >
          <span className={styles.hit} />
          <span className={styles.planetHint} aria-hidden="true">
            ?
          </span>
        </button>
        {branches.map((br, b) => (
          <div key={br.name} className={SIDE[br.side]} data-branch={br.name}>
            <span
              ref={(n) => {
                nameEls.current[b] = n;
              }}
              className={styles.anchor}
              aria-hidden="true"
            >
              <span className={styles.name}>{br.name}</span>
            </span>
            {br.skills.map((sk, s) => {
              const on = view?.kind === "skill" && view.b === b && view.s === s;
              return (
                <button
                  key={sk.name}
                  ref={(n) => {
                    starEls.current[b][s] = n;
                  }}
                  type="button"
                  data-part="star"
                  className={`${styles.star} ${on ? styles.starOn : ""}`}
                  aria-label={`${sk.name} — ${br.name} skill, used in ${sk.usedIn}`}
                  aria-pressed={on}
                  onClick={(e) => api.current?.open({ kind: "skill", b, s }, e.currentTarget)}
                  onPointerEnter={() => api.current?.hover({ b, s })}
                  onPointerLeave={() => api.current?.hover(null)}
                >
                  <span className={styles.hit} />
                  <span className={styles.label} data-part="label" aria-hidden="true">
                    {sk.name}
                    <small className={styles.used}>{sk.usedIn}</small>
                  </span>
                </button>
              );
            })}
            <span
              ref={(n) => {
                lockedEls.current[b] = n;
              }}
              className={styles.anchor}
            >
              <span role="img" data-part="locked" aria-label={`Locked — ${br.nextQuest}`} data-tip={`Locked · ${br.nextQuest}`} className={styles.tip} />
            </span>
            {br.items.map((it, i) => (
              <span
                key={it.name}
                ref={(n) => {
                  itemEls.current[b][i] = n;
                }}
                className={styles.anchor}
              >
                <span role="img" data-part="item" aria-label={`${it.name}, used in ${it.usedIn}`} data-tip={`${it.name} · ${it.usedIn}`} className={styles.tip} />
              </span>
            ))}
          </div>
        ))}
        <span ref={synEl} className={styles.anchor} aria-hidden="true">
          <span className={styles.syn}>{synergy.label}</span>
        </span>
      </div>
      <SkyCard ref={cardEl} view={card.view} open={card.open} side={card.side} onClose={() => api.current?.close()} />
    </div>
  );
}
