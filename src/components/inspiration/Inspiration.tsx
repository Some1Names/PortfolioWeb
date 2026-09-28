"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { inspiration } from "@/data/inspiration";
import ModuleLabel from "../motifs/ModuleLabel";
import EndBand from "../motifs/EndBand";
import Crosshairs from "../hud/Crosshairs";
import FavCard from "./FavCard";
import styles from "./Inspiration.module.css";

// The supplement: a header, one section per group of favourites, and a footer with credits.
export default function Inspiration() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // each group's cards rise in as the group scrolls into view
      root.current?.querySelectorAll<HTMLElement>(`.${styles.cards}`).forEach((list) => {
        gsap.from(list.children, {
          y: 24,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.06,
          scrollTrigger: { trigger: list, start: "top 85%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} className={styles.page}>
      <header className={`${styles.head} web-grid`}>
        <Crosshairs />
        <span className={styles.kicker}>{inspiration.label}</span>
        <h1 className={styles.title}>{inspiration.title}</h1>
        <p className={styles.intro}>{inspiration.intro}</p>
      </header>

      {inspiration.groups.map((g, i) => (
        <section key={g.id} id={g.id} aria-label={g.label} className={styles.group}>
          <ModuleLabel n={String(i + 1).padStart(2, "0")} text={g.label} />
          <ul className={styles.cards}>
            {g.items.map((f) => (
              <li key={f.title}>
                <FavCard fav={f} group={g} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <footer className={styles.foot}>
        <p className={styles.credits}>{inspiration.credits}</p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full load on purpose: Lenis and the hero pin set up on load (see Nav) */}
        <a href="/" className={styles.back}>
          ← Back to the issue
        </a>
      </footer>
      <EndBand />
    </div>
  );
}
