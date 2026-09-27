"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { about } from "@/data/site";
import Cutout from "./motifs/Cutout";
import Tag from "./hud/Tag";
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
        `.${styles.still}`,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: root.current, start: "top 70%" } },
      );
      // the orchid drifts slowly, like it's floating
      gsap.to(`.${styles.orchid}`, { y: -8, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 });
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

      <figure className={styles.still}>
        <Cutout
          src={about.portrait.src}
          alt={about.portrait.alt}
          mode="screen"
          sizes="(max-width: 900px) 100vw, 45vw"
          className={styles.orchid}
        />
        <Tag label={about.portrait.fig} x={70} y={88} to={{ x: 52, y: 62 }} side="collide" phone={{ x: 0, y: 2 }} />
        <figcaption className={styles.stillFoot}>
          <span className={styles.sig}>Uefa</span>
          <span>ACS · KMUTT · Thailand</span>
        </figcaption>
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
