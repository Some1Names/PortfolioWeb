"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { site } from "@/data/site";
import Seam from "./motifs/Seam";
import Folio from "./motifs/Folio";
import ModuleLabel from "./motifs/ModuleLabel";
import Silk from "./reactbits/Silk";
import styles from "./Contact.module.css";

export default function Contact() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduce = prefersReducedMotion();
      if (!reduce) {
        gsap.from(`.${styles.seam}`, {
          scaleX: 0,
          duration: 1.2,
          ease: "power3.inOut",
          scrollTrigger: { trigger: `.${styles.seam}`, start: "top 90%" },
        });
        gsap.from(`.${styles.line}`, {
          yPercent: 110,
          duration: 1.1,
          stagger: 0.12,
          ease: "power4.out",
          scrollTrigger: { trigger: `.${styles.headline}`, start: "top 80%" },
        });
      }
      // achievement toast pops in near the end of the page
      gsap.fromTo(
        `.${styles.toast}`,
        { x: 40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: reduce ? 0 : 0.7,
          ease: "back.out(1.6)",
          scrollTrigger: { trigger: root.current, start: "top 40%", toggleActions: "play none none reverse" },
        },
      );
    },
    { scope: root },
  );

  return (
    <section id="contact" ref={root} className={styles.contact}>
      <Silk className={styles.silk} color="#4a3a7a" speed={3} scale={1} noiseIntensity={1.4} rotation={0.35} />
      <div className={styles.shade} aria-hidden="true" />
      <div className={`outline-num ${styles.bigNum}`} aria-hidden="true">
        05
      </div>

      <div className={`${styles.toast} glass`} role="status">
        <div className={styles.toastIcon}>★</div>
        <div className={styles.toastText}>
          <span>Achievement unlocked</span>
          <strong>Read the whole issue</strong>
          <em>+100 XP</em>
        </div>
      </div>

      <ModuleLabel n="05" text="Contact" />
      <h2 className={styles.headline}>
        <span className={styles.mask}>
          <span className={styles.line}>Let’s build</span>
        </span>
        <span className={styles.mask}>
          <span className={`${styles.line} ${styles.soft}`}>something.</span>
        </span>
      </h2>

      <div className={styles.grid}>
        <div className={styles.emails}>
          {site.emails.map((e) => (
            <a key={e.address} href={`mailto:${e.address}`} className={styles.email}>
              <span className="section-label">{e.label}</span>
              <span className={styles.emailValue}>{e.address}</span>
            </a>
          ))}
        </div>
        <div className={styles.links}>
          {site.links.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer">
              <span>{l.label}</span>
              <span className={styles.handle}>{l.handle} ↗</span>
            </a>
          ))}
        </div>
      </div>

      <Seam direction="horizontal" className={styles.seam} />

      <div className={styles.end}>
        <p className={styles.colophon}>
          End of {site.volume}: designed, drawn and coded by hand.
          <br />
          Set in Orange Avenue and Geist Mono. <span>When art &amp; web collide.</span>
        </p>
        <div className={styles.barcode} aria-hidden="true">
          <div />
          <span>UF—2026—V01—END</span>
        </div>
      </div>

      <Folio page={7} className={styles.folio} />
      <footer className={styles.footer}>
        <span>© {site.year} Uefa</span>
        <span>Built with Next.js + Lenis</span>
        <a href="#top">Back to top ↑</a>
      </footer>
    </section>
  );
}
