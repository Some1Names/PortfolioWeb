"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { timeline, tagSide } from "@/data/timeline";
import Folio from "./motifs/Folio";
import ModuleLabel from "./motifs/ModuleLabel";
import Crosshairs from "./hud/Crosshairs";
import styles from "./Timeline.module.css";

const SIDE_CLASS = { art: styles.tagArt, web: styles.tagWeb, collide: styles.tagNow };

export default function Timeline() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // the rail draws downward with scroll
      gsap.fromTo(
        `.${styles.railFill}`,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: `.${styles.list}`, start: "top 55%", end: "bottom 55%", scrub: true },
        },
      );
      // each dot fills as its row crosses the middle of the screen
      gsap.utils.toArray<HTMLElement>(`.${styles.row}`).forEach((row) => {
        gsap.to(row, {
          scrollTrigger: {
            trigger: row,
            start: "top 55%",
            toggleClass: { targets: row, className: styles.active },
          },
        });
        gsap.from(row.querySelectorAll(`.${styles.fade}`), {
          opacity: 0,
          y: 16,
          duration: 0.6,
          stagger: 0.06,
          ease: "power2.out",
          scrollTrigger: { trigger: row, start: "top 85%" },
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="timeline" ref={root} className={styles.timeline}>
      <Crosshairs />
      <header className={`section-head ${styles.head}`}>
        <div>
          <ModuleLabel n="03" text="Timeline · Quest log" />
          <h2>So far</h2>
        </div>
        <span className={styles.stamp}>Mock data — replace</span>
      </header>

      <div className={styles.list}>
        <div className={styles.rail} aria-hidden="true">
          <div className={styles.railFill} />
        </div>
        <ol className={styles.ol}>
        {timeline.map((t, i) => {
          const side = tagSide[t.tag];
          return (
            <li key={i} className={styles.row}>
              <span className={`${styles.year} ${styles.fade}`}>{t.year}</span>
              <span className={styles.node} aria-hidden="true">
                <i />
              </span>
              <span className={`${styles.title} ${styles.fade}`}>{t.title}</span>
              <span className={`${styles.note} ${styles.fade}`}>{t.note}</span>
              <span className={`${styles.tag} ${side ? SIDE_CLASS[side] : ""} ${styles.fade}`}>{t.tag}</span>
            </li>
          );
        })}
        </ol>
      </div>
      <Folio page={4} />
    </section>
  );
}
