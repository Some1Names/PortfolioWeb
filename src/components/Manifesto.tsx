"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { thesis, manifesto } from "@/data/site";
import Seam from "./motifs/Seam";
import Cutout from "./motifs/Cutout";
import Tag from "./hud/Tag";
import Folio from "./motifs/Folio";
import ModuleLabel from "./motifs/ModuleLabel";
import DecryptedText from "./reactbits/DecryptedText";
import styles from "./Manifesto.module.css";

export default function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // the two pages slide in from the edges and meet at the seam
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top 85%", end: "top 15%", scrub: 1 },
      });
      tl.from(`.${styles.art}`, { xPercent: -10, opacity: 0 }, 0)
        .from(`.${styles.web}`, { xPercent: 10, opacity: 0 }, 0)
        .from(`.${styles.seam}`, { scaleX: 0, scaleY: 0 }, 0);

      // "collide." snaps in on its own once it is on screen (on phones it sits below both pages)
      gsap.from(`.${styles.collide}`, {
        opacity: 0,
        yPercent: 40,
        scale: 0.94,
        duration: 0.5,
        ease: "back.out(2)",
        scrollTrigger: { trigger: `.${styles.collide}`, start: "top 85%", toggleActions: "play none none reverse" },
      });
    },
    { scope: root },
  );

  return (
    <section id="manifesto" ref={root} className={styles.manifesto} aria-labelledby="manifesto-title">
      <h2 id="manifesto-title" className={styles.srOnly}>
        {thesis.lead} {thesis.art} and {thesis.web} {thesis.end}
      </h2>

      <div className={`${styles.page} ${styles.art} hatch`}>
        <ModuleLabel n="00" text="Manifesto" />
        <p className={styles.bigArt} aria-hidden="true">
          {thesis.lead} <span>{thesis.art}</span>
        </p>
        <figure className={styles.figure}>
          <Cutout
            src={manifesto.artSrc}
            alt={manifesto.artAlt}
            mode="fade"
            sizes="(max-width: 900px) 100vw, 420px"
            className={styles.painting}
          />
          <Tag label={manifesto.fig} x={104} y={80} to={{ x: 72, y: 50 }} side="art" phone={{ x: 2, y: 88 }} />
        </figure>
      </div>

      <Seam direction="auto" className={styles.seam} />

      <div className={`${styles.page} ${styles.web} web-grid`}>
        <span className="fig-web">Fig. B — Web / grid, code, light</span>
        <p className={styles.bigWeb} aria-hidden="true">
          <span className={styles.amp}>&amp;</span> {thesis.web}
        </p>
        <pre className={`code-deco ${styles.code}`} aria-hidden="true">
          <span className="c">{"// collide.ts"}</span>
          {"\n"}
          <span className="k">const</span> page = <span className="f">draw</span>(sketch);
          {"\n"}
          page.<span className="f">render</span>({"{ on: "}
          <span className="s">&quot;web&quot;</span>
          {" });"}
        </pre>
        <div className={styles.lines}>
          {manifesto.lines.map((l, i) => (
            <p key={i}>
              <DecryptedText text={l} delay={i * 350} duration={1500} encryptedClassName={styles.encrypted} />
            </p>
          ))}
        </div>
      </div>

      <p className={styles.collide} aria-hidden="true">
        <i>{thesis.end}</i>
      </p>
      <Folio page={2} />
    </section>
  );
}
