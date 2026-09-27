"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { about } from "@/data/site";
import ArtSlot from "./motifs/ArtSlot";
import Seam from "./motifs/Seam";
import Folio from "./motifs/Folio";
import ModuleLabel from "./motifs/ModuleLabel";
import styles from "./About.module.css";

export default function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // statement lights up word by word as you scroll through it
      gsap.fromTo(
        `.${styles.word}`,
        { opacity: 0.15 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: { trigger: `.${styles.statement}`, start: "top 80%", end: "bottom 45%", scrub: true },
        },
      );
      gsap.fromTo(
        `.${styles.portrait}`,
        { scale: 0.94, opacity: 0 },
        { scale: 1, opacity: 1, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: root.current, start: "top 70%" } },
      );
      gsap.from(`.${styles.seam}`, {
        scaleX: 0,
        scaleY: 0,
        duration: 1.2,
        ease: "power3.inOut",
        scrollTrigger: { trigger: root.current, start: "top 70%" },
      });
      gsap.from(`.${styles.fact}`, {
        opacity: 0,
        x: -16,
        duration: 0.6,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: { trigger: `.${styles.facts}`, start: "top 85%" },
      });
    },
    { scope: root },
  );

  const words = about.statement.split(" ");

  return (
    <section id="about" ref={root} className={styles.about}>
      <div className={styles.beam} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />
      <div className={`${styles.grid} web-grid`} aria-hidden="true" />

      <figure className={`${styles.portrait} glass`}>
        <figcaption className={styles.portraitHead}>
          <span>Portrait</span>
          <span className="fig-art">Fig. 02 — Art</span>
        </figcaption>
        <ArtSlot
          label="[ portrait / still of you ]"
          src={about.portrait || undefined}
          alt="Portrait of Uefa"
          sizes="(max-width: 900px) 100vw, 40vw"
          className={styles.portraitBody}
        />
        <div className={styles.portraitFoot}>
          <span className={styles.sig}>Uefa</span>
          <span>ACS · KMUTT · Thailand</span>
        </div>
      </figure>

      <Seam direction="auto" className={styles.seam} />

      <div className={styles.text}>
        <ModuleLabel n="02" text="About" />
        <h2 className={styles.statement}>
          {words.map((w, i) => (
            <span key={i} className={`${styles.word} ${w.replace(/\W/g, "") === about.highlight ? styles.hl : ""}`}>
              {w}{" "}
            </span>
          ))}
        </h2>
        <p className={styles.lead}>{about.body[0]}</p>
        <p className={styles.sub}>{about.body[1]}</p>
        <dl className={`${styles.facts} glass`}>
          {about.facts.map((f) => (
            <div key={f.label} className={styles.fact}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Folio page={4} />
    </section>
  );
}
