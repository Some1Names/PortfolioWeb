"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import styles from "./Nav.module.css";

const items = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Timeline", href: "#timeline" },
  { label: "Skills", href: "#skills" },
  { label: "Contact", href: "#contact" },
];

// The nav is a thin strip along the top (after darkroom.engineering): a hairline across the
// page with small tabs sitting on it. It is thin enough to stay on screen the whole time.
// On the home page the section links scroll in place. On other pages (the /inspiration
// supplement) they go back to the home page's sections. Page links are plain <a> on purpose:
// a full load lets Lenis and the hero pin set up fresh, so /#work lands in the right place.
export default function Nav({ page = "home" }: { page?: "home" | "inspiration" }) {
  const home = page === "home";
  const sectionHref = (href: string) => (home ? href : `/${href}`);
  const bar = useRef<HTMLDivElement>(null);
  const value = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useGSAP(() => {
    // XP bar = scroll progress through the whole page (updated directly, no re-render)
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        gsap.set(bar.current, { scaleX: self.progress });
        if (value.current) value.current.textContent = `${String(Math.round(self.progress * 100)).padStart(2, "0")}%`;
      },
    });

    if (!home) return;
    // current section = the one crossing the middle of the screen.
    // refreshPriority -1 measures these after the hero's pin spacer exists; the nav is created
    // before the hero, so without it every start would be one screen too early.
    items.forEach((it) => {
      const el = document.querySelector(it.href);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        start: "top 50%",
        end: "bottom 50%",
        refreshPriority: -1,
        onToggle: (self) => setActive((cur) => (self.isActive ? it.href : cur === it.href ? null : cur)),
      });
    });
  });

  const onInspiration = page === "inspiration" ? "page" : undefined;

  return (
    <nav className={styles.nav} aria-label="Main">
      <div className={styles.start}>
        {/* the art → web seam, as a row of squares */}
        <span className={`${styles.tab} ${styles.squares}`} aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <a href={home ? "#top" : "/"} className={`${styles.tab} ${styles.brand}`}>
          Uefa
        </a>
      </div>

      <div className={styles.links}>
        {items.map((it) => (
          <a
            key={it.href}
            href={sectionHref(it.href)}
            className={styles.tab}
            aria-current={active === it.href ? "true" : undefined}
          >
            {it.label}
          </a>
        ))}
        {/* the supplement: its own page, marked "+" */}
        <a href="/inspiration" className={styles.tab} aria-current={onInspiration}>
          <span className={styles.plus}>+</span> Inspiration
        </a>
      </div>

      <div className={styles.end}>
        <div className={`${styles.tab} ${styles.xp}`} data-part="xp" aria-hidden="true">
          <span>XP</span>
          <div className={styles.track}>
            <div ref={bar} className={styles.fill} />
          </div>
          <span ref={value} className={styles.xpValue}>
            00%
          </span>
        </div>
        <button
          type="button"
          className={`${styles.tab} ${styles.menuBtn}`}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        // data-lenis-prevent: the sheet scrolls natively, not through Lenis
        <div className={styles.sheet} data-lenis-prevent>
          {items.map((it) => (
            <a
              key={it.href}
              href={sectionHref(it.href)}
              onClick={() => setOpen(false)}
              aria-current={active === it.href ? "true" : undefined}
            >
              {it.label}
            </a>
          ))}
          <a href="/inspiration" onClick={() => setOpen(false)} aria-current={onInspiration}>
            <span className={styles.plus}>+</span> Inspiration
          </a>
        </div>
      )}
    </nav>
  );
}
