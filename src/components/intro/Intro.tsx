"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { finishIntro, introTooLate } from "@/lib/intro";
import { site, cover, thesis } from "@/data/site";
import SysTime from "../hud/SysTime";
import { DURATION, T, makePool, drawScene, measureHalf, counterAt, seg } from "./scene";
import styles from "./Intro.module.css";

// The thesis the intro ends on, broken into the hero's three lines, so the cover's own line reads as
// this one landing ("art" pink and "web" blue in the white copy; the glitch copies are one colour).
const Thesis = () => (
  <>
    {thesis.lead} <span className={styles.art}>{thesis.art}</span> <br />
    and <span className={styles.web}>{thesis.web}</span> <br />
    {thesis.end}
  </>
);

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

    // once it's over, let go of everything: listeners, and the canvas's pixel buffer
    const finish = () => {
      detach();
      c.width = 0;
      c.height = 0;
      off();
    };

    // created paused: a site opened in a background tab starts the intro when it's first shown,
    // instead of running (or jumping to its end) while nobody is looking
    const tl = gsap.timeline({ paused: true, onComplete: finish });
    tl.to(state, { t: DURATION, duration: DURATION, ease: "none", onUpdate: render }, 0)
      .set(m, { autoAlpha: 1 }, T.mark)
      .call(() => m.classList.add(styles.glitch), undefined, T.mark)
      .call(handOver, undefined, T.handover)
      .to(el, { autoAlpha: 0, duration: T.end - T.handover, ease: "power2.out" }, T.handover);
    if (process.env.NODE_ENV !== "production") (window as Window & { __introTL?: gsap.core.Timeline }).__introTL = tl;
    let started = false;
    const start = () => {
      if (started || handed || document.visibilityState !== "visible") return;
      started = true;
      tl.play();
    };

    const skip = () => {
      if (handed) return;
      tl.pause();
      handOver();
      gsap.to(el, { autoAlpha: 0, duration: 0.4, ease: "power2.out", onComplete: finish });
    };
    const onKey = (e: KeyboardEvent) => {
      // Tab / Shift+Tab move focus to the Skip button; a modifier on its own, or a shortcut
      // (Ctrl+R, Cmd+Tab…), isn't a skip
      if (e.key === "Tab" || e.ctrlKey || e.metaKey || e.altKey || ["Shift", "Control", "Alt", "Meta"].includes(e.key)) return;
      e.preventDefault(); // Space / arrows / PageDown would also scroll the page the moment it unlocks
      skip();
    };
    const onResize = () => {
      size();
      render();
    };
    const detach = () => {
      el.removeEventListener("click", skip);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", start);
    };
    size();
    render();
    el.addEventListener("click", skip);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", start);
    start();
    return () => {
      tl.kill();
      detach();
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
        <span className={styles.markPink}>
          <Thesis />
        </span>
        <span className={styles.markBlue}>
          <Thesis />
        </span>
        <span className={styles.markMain}>
          <Thesis />
        </span>
      </div>
      <button type="button" className={styles.skip} data-part="skip">
        Skip intro →
      </button>
    </div>
  );
}
