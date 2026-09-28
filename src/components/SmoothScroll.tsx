"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { introPlaying, onIntroDone } from "@/lib/intro";

// scroll positions are saved per page, so Back from another page returns to where you were
const scrollKey = () => `scroll-y:${window.location.pathname}`;

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // The hero pin adds a screen of scroll space only once GSAP runs (after hydration), so a
    // position the browser applied earlier (a #hash, or the spot it restores on reload) ends up
    // a screen off and the page jumps. This effect runs after every section has created its
    // ScrollTriggers, so take over here: restore a reload or Back/Forward to where it was,
    // otherwise go to the hash target or the top, now that the pin exists.
    history.scrollRestoration = "manual";
    ScrollTrigger.refresh();
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    let saved: number | null = null;
    try {
      const raw = sessionStorage.getItem(scrollKey());
      if ((nav?.type === "reload" || nav?.type === "back_forward") && raw) saved = Number(raw);
    } catch {}
    const hashTarget = window.location.hash.length > 1 ? document.getElementById(window.location.hash.slice(1)) : null;
    lenis.scrollTo(saved ?? hashTarget ?? 0, { immediate: true });
    // the loading intro holds the page still until it hands over
    let stopWaiting = () => {};
    if (introPlaying()) {
      lenis.stop();
      stopWaiting = onIntroDone(() => {
        lenis.start();
        // re-measure now the page scrollbar is back: while scrolling was locked, some browsers
        // (phones especially) give the page its full width, and the hero pin kept that width
        ScrollTrigger.refresh();
      });
    }
    const remember = () => {
      try {
        sessionStorage.setItem(scrollKey(), String(window.scrollY));
      } catch {}
    };
    window.addEventListener("pagehide", remember);

    // make in-page anchors (#work etc.) glide instead of jump
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href^='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href")!;
      const el = id === "#top" ? 0 : document.querySelector(id);
      if (el === null) return;
      e.preventDefault();
      lenis.scrollTo(el as HTMLElement | number, { offset: 0 });
    };
    document.addEventListener("click", onClick);

    return () => {
      stopWaiting();
      window.removeEventListener("pagehide", remember);
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
