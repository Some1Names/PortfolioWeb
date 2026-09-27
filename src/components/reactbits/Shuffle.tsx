"use client";

/*
 * Shuffle — from React Bits by David Haz (https://reactbits.dev), MIT + Commons Clause.
 * Local changes: trimmed to horizontal shuffles (the only direction used here), renders a <span>,
 * uses the project's GSAP setup, and never hides the text for visitors who prefer reduced motion
 * (the original kept it invisible for them). Text is only hidden once JS is ready to animate it.
 */
import { useEffect, useRef, useState } from "react";
import { SplitText } from "gsap/SplitText";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import styles from "./Shuffle.module.css";

gsap.registerPlugin(SplitText);

interface ShuffleProps {
  text: string;
  className?: string;
  direction?: "left" | "right";
  duration?: number;
  ease?: string;
  shuffleTimes?: number;
  stagger?: number;
  scrambleCharset?: string;
  colorFrom?: string;
  colorTo?: string;
  triggerOnHover?: boolean;
  start?: string; // ScrollTrigger start
}

export default function Shuffle({
  text,
  className = "",
  direction = "right",
  duration = 0.35,
  ease = "power3.out",
  shuffleTimes = 1,
  stagger = 0.03,
  scrambleCharset = "",
  colorFrom,
  colorTo,
  triggerOnHover = true,
  start = "top 90%",
}: ShuffleProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [armed, setArmed] = useState(false); // JS will animate: hide until the first run
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // resolves right away when fonts are already loaded
    document.fonts.ready.then(() => setFontsLoaded(true));
  }, []);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !text || !fontsLoaded || prefersReducedMotion()) return;
      setArmed(true);

      let split: SplitText | null = null;
      let wrappers: HTMLElement[] = [];
      let tl: gsap.core.Timeline | null = null;
      let playing = false;

      const teardown = () => {
        tl?.kill();
        tl = null;
        wrappers.forEach((wrap) => {
          const orig = wrap.firstElementChild?.querySelector('[data-orig="1"]');
          if (orig && wrap.parentNode) wrap.parentNode.replaceChild(orig, wrap);
        });
        wrappers = [];
        try {
          split?.revert();
        } catch {}
        split = null;
        playing = false;
      };

      const rand = () => scrambleCharset.charAt(Math.floor(Math.random() * scrambleCharset.length));

      // each character becomes a clipped cell holding a strip: [real, scrambles…] that slides into place
      const build = () => {
        teardown();
        split = new SplitText(el, { type: "chars", charsClass: styles.char, reduceWhiteSpace: false });
        const steps = Math.max(1, Math.floor(shuffleTimes)) + 1;
        (split.chars as HTMLElement[]).forEach((ch) => {
          const w = ch.getBoundingClientRect().width;
          if (!w || !ch.parentElement) return;
          const wrap = document.createElement("span");
          Object.assign(wrap.style, { display: "inline-block", overflow: "hidden", width: `${w}px`, verticalAlign: "bottom" });
          const strip = document.createElement("span");
          Object.assign(strip.style, { display: "inline-block", whiteSpace: "nowrap", willChange: "transform" });
          ch.parentElement.insertBefore(wrap, ch);
          wrap.appendChild(strip);

          const cell = (node: HTMLElement) => Object.assign(node.style, { display: "inline-block", width: `${w}px`, textAlign: "center" });
          const first = ch.cloneNode(true) as HTMLElement;
          cell(first);
          ch.setAttribute("data-orig", "1");
          cell(ch);
          strip.appendChild(first);
          for (let k = 1; k < steps; k++) {
            const c = ch.cloneNode(true) as HTMLElement;
            c.removeAttribute("data-orig");
            if (scrambleCharset) c.textContent = rand();
            strip.appendChild(c);
          }
          strip.appendChild(ch);
          if (direction === "right") {
            // real character first, so sliding right lands on it
            const firstCopy = strip.firstElementChild;
            strip.insertBefore(ch, strip.firstChild);
            if (firstCopy) strip.appendChild(firstCopy);
          }
          const from = direction === "right" ? -steps * w : 0;
          const to = direction === "right" ? 0 : -steps * w;
          gsap.set(strip, { x: from, force3D: true });
          strip.dataset.to = String(to);
          if (colorFrom) strip.style.color = colorFrom;
          wrappers.push(wrap);
        });
      };

      const settle = () => {
        wrappers.forEach((w) => {
          const strip = w.firstElementChild as HTMLElement | null;
          const real = strip?.querySelector('[data-orig="1"]');
          if (!strip || !real) return;
          strip.replaceChildren(real);
          strip.style.transform = "none";
          strip.style.willChange = "auto";
          if (colorTo) strip.style.color = colorTo;
        });
      };

      const play = () => {
        const strips = wrappers.map((w) => w.firstElementChild as HTMLElement);
        if (!strips.length) return;
        playing = true;
        tl = gsap.timeline({
          onComplete: () => {
            playing = false;
            settle();
          },
        });
        const odd = strips.filter((_, i) => i % 2 === 1);
        const even = strips.filter((_, i) => i % 2 === 0);
        const add = (targets: HTMLElement[], at: number) => {
          tl!.to(targets, { x: (_: number, t: HTMLElement) => Number(t.dataset.to), duration, ease, stagger, force3D: true }, at);
          if (colorFrom && colorTo) tl!.to(targets, { color: colorTo, duration, ease, stagger }, at);
        };
        if (odd.length) add(odd, 0);
        if (even.length) add(even, odd.length ? (duration + (odd.length - 1) * stagger) * 0.7 : 0);
      };

      const run = () => {
        if (playing) return;
        build();
        play();
        setReady(true);
      };

      const st = ScrollTrigger.create({ trigger: el, start, once: true, onEnter: run });
      if (triggerOnHover) el.addEventListener("mouseenter", run);

      return () => {
        st.kill();
        el.removeEventListener("mouseenter", run);
        teardown();
      };
    },
    { dependencies: [text, fontsLoaded, direction, duration, ease, shuffleTimes, stagger, scrambleCharset, colorFrom, colorTo, triggerOnHover, start], scope: ref },
  );

  return (
    <span ref={ref} className={`${styles.shuffle} ${armed && !ready ? styles.waiting : ""} ${className}`}>
      {text}
    </span>
  );
}
