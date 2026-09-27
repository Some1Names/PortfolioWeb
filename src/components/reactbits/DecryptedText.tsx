"use client";

/*
 * DecryptedText — based on React Bits by David Haz (https://reactbits.dev), MIT + Commons Clause.
 * Rebuilt for this site in its sequential, animate-on-view mode:
 * - no `motion` dependency (the original only used it for a plain wrapper <span>);
 * - screen readers get the real text (the original's screen-reader copy was visibility:hidden,
 *   which hid it from screen readers too, and it held the scrambled text);
 * - the real text reserves the layout and the animation runs in an overlay, so the paragraph
 *   doesn't rewrap while scrambled letters of different widths flicker through;
 * - the text waits "encrypted" until it scrolls into view (plain text without JS or with
 *   reduced motion);
 * - frames are written straight to the DOM instead of re-rendering React state each tick;
 * - characters scramble within their own kind (lowercase, capitals, other), keeping widths close.
 */
import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";
import styles from "./DecryptedText.module.css";

// Each character is scrambled with one of the same kind, so a scrambled line stays about as
// wide as the real one (a mixed set of capitals and symbols made lines wrap further).
const LOWER = "abcdefghijklmnopqrstuvwxyz0123456789";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const OTHER = "#%&*+=/<>";
const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
const scramble = (c: string) =>
  c === " " ? " " : /[a-z0-9]/.test(c) ? pick(LOWER) : /[A-Z]/.test(c) ? pick(UPPER) : pick(OTHER);

interface DecryptedTextProps {
  text: string;
  duration?: number; // ms for the whole line to decrypt
  delay?: number; // ms after coming into view
  className?: string;
  encryptedClassName?: string; // style for the still-scrambled tail
}

export default function DecryptedText({
  text,
  duration = 1600,
  delay = 0,
  className = "",
  encryptedClassName = "",
}: DecryptedTextProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const overlayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const overlay = overlayRef.current;
    if (!wrap || !overlay || prefersReducedMotion()) return;

    const TICK = 30;
    const step = Math.max(1, Math.ceil((text.length * TICK) / duration));
    const tail = document.createElement("span");
    if (encryptedClassName) tail.className = encryptedClassName;

    // revealed part as plain text, the rest scrambled (spaces kept so words stay words)
    const draw = (revealed: number) => {
      tail.textContent = Array.from(text.slice(revealed), scramble).join("");
      overlay.replaceChildren(text.slice(0, revealed), tail);
    };

    draw(0);
    let timer = 0;
    let wait = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        wait = window.setTimeout(() => {
          let revealed = 0;
          timer = window.setInterval(() => {
            revealed = Math.min(text.length, revealed + step);
            if (revealed >= text.length) {
              window.clearInterval(timer);
              overlay.replaceChildren(text);
            } else draw(revealed);
          }, TICK);
        }, delay);
      },
      { threshold: 0.1 },
    );
    observer.observe(wrap);

    return () => {
      observer.disconnect();
      window.clearTimeout(wait);
      window.clearInterval(timer);
      overlay.replaceChildren(text);
    };
  }, [text, duration, delay, encryptedClassName]);

  return (
    <span ref={wrapRef} className={`${styles.wrap} ${className}`}>
      <span className={styles.sr}>{text}</span>
      <span className={styles.ghost} aria-hidden="true">
        {text}
      </span>
      <span ref={overlayRef} className={styles.overlay} aria-hidden="true">
        {text}
      </span>
    </span>
  );
}
