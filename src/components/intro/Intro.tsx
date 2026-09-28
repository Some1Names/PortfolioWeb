"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { finishIntro, introTooLate } from "@/lib/intro";
import { site, cover } from "@/data/site";
import SysTime from "../hud/SysTime";
import { DURATION, T, makePool, drawScene, measureHalf, counterAt, seg } from "./scene";
import styles from "./Intro.module.css";

// The first-visit loading intro (docs/superpowers/specs/2026-09-28-loading-intro-design.md).
// IntroGate's inline script decides before the first paint whether it plays, by setting
// data-intro="play" on <html>; without that the overlay stays display: none. The server always
// renders the overlay and the first client render matches it; then this plays it or removes it.
export default function Intro() {
  const [done, setDone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const mark = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const d = document.documentElement;
    const off = () => setDone(true);
    const el = root.current;
    const c = canvas.current;
    const m = mark.current;
    const ctx = c?.getContext("2d");
    // not playing (or JS too late, or reduced motion): release anyone waiting and remove the overlay
    if (d.dataset.intro !== "play" || prefersReducedMotion() || introTooLate(performance.now()) || !el || !c || !m || !ctx) {
      finishIntro();
      const id = setTimeout(off, 0);
      return () => clearTimeout(id);
    }

    d.dataset.introJs = ""; // the JS is here: cancel the CSS failsafe
    d.style.overflow = "hidden";
    el.classList.add(styles.running);

    const pool = makePool(7);
    const state = { t: 0 };
    let w = 0;
    let h = 0;
    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const render = () => {
      drawScene(ctx, state.t, w, h, pool);
      if (counter.current) counter.current.textContent = counterAt(state.t);
      if (label.current) {
        label.current.textContent = `W ${Math.round(2 * measureHalf(state.t, w))}`;
        label.current.style.opacity = String(seg(state.t, T.line, 0.4) * (1 - seg(state.t, T.grid, 1.2)));
      }
    };

    let handed = false;
    const release = () => {
      d.style.overflow = "";
      delete d.dataset.introJs;
    };
    const handOver = () => {
      if (handed) return;
      handed = true;
      release();
      finishIntro();
    };

    const tl = gsap.timeline({ onComplete: off });
    tl.to(state, { t: DURATION, duration: DURATION, ease: "none", onUpdate: render }, 0)
      .set(m, { autoAlpha: 1 }, T.mark)
      .call(() => m.classList.add(styles.glitch), undefined, T.mark)
      .call(handOver, undefined, T.handover)
      .to(el, { autoAlpha: 0, duration: T.end - T.handover, ease: "power2.out" }, T.handover);
    if (process.env.NODE_ENV !== "production") (window as Window & { __introTL?: gsap.core.Timeline }).__introTL = tl;

    const skip = () => {
      if (handed) return;
      tl.pause();
      handOver();
      gsap.to(el, { autoAlpha: 0, duration: 0.4, ease: "power2.out", onComplete: off });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") return; // Tab / Shift+Tab move focus to the Skip button
      skip();
    };
    const onResize = () => {
      size();
      render();
    };
    size();
    render();
    el.addEventListener("click", skip);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      tl.kill();
      el.removeEventListener("click", skip);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      if (!handed) release();
    };
  }, []);

  if (done) return null;
  return (
    <div ref={root} className={styles.intro} data-intro-overlay="">
      <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
      <span className={`${styles.corner} ${styles.tl}`} aria-hidden="true">
        Portfolio {site.volume}
      </span>
      <span className={`${styles.corner} ${styles.tr}`} aria-hidden="true">
        SYS_TIME <SysTime /> · UTC+7
      </span>
      <span className={`${styles.corner} ${styles.bl}`} aria-hidden="true">
        Rendering{" "}
        <span ref={counter} data-part="counter">
          000
        </span>
      </span>
      <span className={`${styles.corner} ${styles.br}`} aria-hidden="true">
        {cover.coords}
      </span>
      <span ref={label} className={styles.lineLabel} data-part="line-label" aria-hidden="true" />
      <div ref={mark} className={styles.mark} data-part="mark" aria-hidden="true">
        <span className={styles.markPink}>{site.name}</span>
        <span className={styles.markBlue}>{site.name}</span>
        <span className={styles.markMain}>{site.name}</span>
      </div>
      <button type="button" className={styles.skip} data-part="skip">
        Skip intro →
      </button>
    </div>
  );
}
