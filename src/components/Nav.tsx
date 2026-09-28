"use client";

import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import styles from "./Nav.module.css";

const items = [
  { n: "00", label: "Manifesto", href: "#manifesto" },
  { n: "01", label: "Work", href: "#work" },
  { n: "02", label: "About", href: "#about" },
  { n: "03", label: "Timeline", href: "#timeline" },
  { n: "04", label: "Skills", href: "#skills" },
  { n: "05", label: "Contact", href: "#contact" },
];

// the nav stays put for the first bit of the page, then hides while you scroll down
const HIDE_AFTER = 80;
// ignore scroll jitter smaller than this before flipping between hidden and shown
const TOLERANCE = 8;

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
  const [hidden, setHidden] = useState(false);

  useGSAP(() => {
    let lastY = 0;
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        // XP bar = scroll progress through the whole page (updated directly, no re-render)
        gsap.set(bar.current, { scaleX: self.progress });
        if (value.current) value.current.textContent = `${String(Math.round(self.progress * 100)).padStart(2, "0")}%`;

        // nav: hide on the way down, show again as soon as you scroll up
        const y = self.scroll();
        if (y < HIDE_AFTER) {
          setHidden(false);
          lastY = y;
        } else if (Math.abs(y - lastY) > TOLERANCE) {
          setHidden(y > lastY);
          lastY = y;
        }
      },
    });

    if (!home) return;
    // current module = the section crossing the middle of the screen.
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

  // an open mobile menu keeps the nav on screen
  const navHidden = hidden && !open;
  const onInspiration = page === "inspiration" ? "page" : undefined;

  return (
    <>
      <nav className={`${styles.nav} glass ${navHidden ? styles.navHidden : ""}`} aria-label="Main">
        <a href={home ? "#top" : "/"} className={styles.logo}>
          Uefa
        </a>
        <div className={styles.links}>
          {items.map((it) => (
            <a
              key={it.href}
              href={sectionHref(it.href)}
              className={styles.link}
              aria-current={active === it.href ? "true" : undefined}
            >
              {it.n} {it.label}
            </a>
          ))}
          {/* the supplement: its own page, marked "+" instead of a section number */}
          <a href="/inspiration" className={styles.link} aria-current={onInspiration}>
            <span className={styles.plus}>+</span> Inspiration
          </a>
        </div>
        {/* keeps the XP gauge's slot free, so the links sit where they did */}
        <span className={styles.xpSpace} aria-hidden="true" />
        <button className={styles.menuBtn} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? "Close" : "Menu"}
        </button>
        {open && (
          // data-lenis-prevent: the sheet scrolls natively, not through Lenis
          <div className={`${styles.sheet} glass`} data-lenis-prevent>
            {items.map((it) => (
              <a
                key={it.href}
                href={sectionHref(it.href)}
                onClick={() => setOpen(false)}
                aria-current={active === it.href ? "true" : undefined}
              >
                <span>{it.n}</span>
                {it.label}
              </a>
            ))}
            <a href="/inspiration" onClick={() => setOpen(false)} aria-current={onInspiration}>
              <span>+</span>
              Inspiration
            </a>
          </div>
        )}
      </nav>

      {/* XP lives outside the nav, so it stays on screen when the nav slides away */}
      <div className={`${styles.xp} ${navHidden ? styles.xpAlone : ""}`} aria-hidden="true">
        <span>XP</span>
        <div className={styles.track}>
          <div ref={bar} className={styles.fill} />
        </div>
        <span ref={value} className={styles.xpValue}>
          00%
        </span>
      </div>
    </>
  );
}
