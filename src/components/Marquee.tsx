"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { site } from "@/data/site";
import Logo from "./motifs/Logo";
import styles from "./Marquee.module.css";

export default function Marquee() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // track holds the list twice; moving it by -50% loops seamlessly
      const loop = gsap.to(track.current, { xPercent: -50, duration: 80, ease: "none", repeat: -1 });

      // scroll faster → strip runs faster; scroll up → it reverses
      let settle: gsap.core.Tween | undefined;
      ScrollTrigger.create({
        onUpdate: (self) => {
          const direction = self.direction;
          const boost = gsap.utils.clamp(1, 6, Math.abs(self.getVelocity()) / 300);
          gsap.to(loop, { timeScale: boost * direction, duration: 0.2, overwrite: true });
          settle?.kill();
          settle = gsap.delayedCall(0.25, () => {
            gsap.to(loop, { timeScale: direction, duration: 1, overwrite: true });
          });
        },
      });
    },
    { scope: root },
  );

  const items = [...site.marquee, ...site.marquee];

  return (
    <div ref={root} className={styles.strip} aria-label={site.marquee.map((m) => m.label).join(", ")}>
      <div ref={track} className={styles.track} aria-hidden="true">
        {[0, 1].map((copy) => (
          <div key={copy} className={styles.group}>
            {items.map((t, i) => (
              <span key={i} className={`${styles.item} ${t.side === "art" ? styles.art : styles.web}`} title={t.label}>
                <Logo name={t.label} className={styles.logo} />
                <i className={styles.dot} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
