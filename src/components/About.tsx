"use client";

import { Fragment, useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { about, site } from "@/data/site";
import Cutout from "./motifs/Cutout";
import Tag from "./hud/Tag";
import Seam from "./motifs/Seam";
import Folio from "./motifs/Folio";
import ModuleLabel from "./motifs/ModuleLabel";
import Crosshairs from "./hud/Crosshairs";
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
      // the picture drifts slowly, like it's floating
      gsap.to(`.${styles.art}`, { y: -8, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 });
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
  const art = about.portrait;

  return (
    <section id="about" ref={root} className={styles.about}>
      <Crosshairs />
      <div className={styles.beam} aria-hidden="true" />
      <div className={styles.glow} aria-hidden="true" />
      <div className={`${styles.grid} web-grid`} aria-hidden="true" />

      <figure className={`${styles.still} ${art.mode === "screen" ? styles.stillScreen : styles.stillAlpha}`}>
        <Cutout
          src={art.src}
          alt={art.alt}
          mode={art.mode}
          sizes="(max-width: 900px) 100vw, 45vw"
          // a cut-out stands in the bottom-left corner, against the page edge
          position={art.mode === "alpha" ? "0% 100%" : undefined}
          className={styles.art}
        />
        {/* starts left of centre so the label (~225px) stays clear of the text column down to 901px */}
        <Tag label={art.fig} x={48} y={88} to={{ x: 40, y: 60 }} side="collide" phone={{ x: 0, y: 2 }} />
        {/* the name, then the other names you go by (in their own capitals) over the school. Each
            name keeps its dot and never splits, so a narrow screen breaks between names, before a dot */}
        <figcaption className={styles.stillFoot}>
          <span className={styles.sig}>{site.name}</span>
          <div className={styles.stillLines}>
            <span className={styles.aka} data-part="aka">
              <b>a.k.a.</b>{" "}
              {site.aka.map((n, i) => (
                <Fragment key={n}>
                  {i > 0 && " "}
                  <span className={styles.akaName} data-part="aka-name">
                    {i > 0 ? `· ${n}` : n}
                  </span>
                </Fragment>
              ))}
            </span>
            <span>ACS · KMUTT · Thailand</span>
          </div>
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
        <a href="/inspiration" className={styles.inspire}>
          What inspires me →
        </a>
      </div>
      <Folio page={4} />
    </section>
  );
}
