"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const SCROLL_KEY = "scroll-y";

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
    // ScrollTriggers, so take over here: restore a reload to where it was, otherwise go to the
    // hash target or the top, now that the pin exists.
    history.scrollRestoration = "manual";
    ScrollTrigger.refresh();
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    let saved: number | null = null;
    try {
      const raw = sessionStorage.getItem(SCROLL_KEY);
      if (nav?.type === "reload" && raw) saved = Number(raw);
    } catch {}
    const hashTarget = window.location.hash.length > 1 ? document.getElementById(window.location.hash.slice(1)) : null;
    lenis.scrollTo(saved ?? hashTarget ?? 0, { immediate: true });
    const remember = () => {
      try {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
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
      window.removeEventListener("pagehide", remember);
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
