"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { thesis, manifesto } from "@/data/site";
import Seam from "./motifs/Seam";
import Folio from "./motifs/Folio";
import ModuleLabel from "./motifs/ModuleLabel";
import ArtSlot from "./motifs/ArtSlot";
import DecryptedText from "./reactbits/DecryptedText";
import styles from "./Manifesto.module.css";

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

// 00 — Manifesto: the thesis happens instead of being stated. The stage pins while you scroll:
// "art" (pink serif) comes in from the left and "WEB" (blue mono) from the right; they meet in the
// middle (a flash, a shockwave, the seam shooting up); "collide." breaks out of the impact and
// the two words settle above it as an "art × WEB" lockup. A readout counts the distance down to
// IMPACT. After the stage come the three manifesto lines (they decrypt as they arrive) and a slot
// for a drawing. The CSS lays out the finished state, which is what reduced motion gets; the
// timeline animates into it.
export default function Manifesto() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const distance = useRef<HTMLElement>(null);
  const impact = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !stage.current) return;
      const q = gsap.utils.selector(root);
      const [row] = q(`.${styles.row}`) as HTMLElement[];
      const [art] = q("[data-part=art]") as HTMLElement[];
      const [web] = q("[data-part=web]") as HTMLElement[];
      const readout = q("[data-part=readout]")[0] as HTMLElement;

      // measured from the finished layout (and again on resize): the row is small in its lockup
      // and scale× bigger at the impact, centred on the stage
      const size = () => parseFloat(getComputedStyle(row).fontSize);
      const scale = () => Math.min(2.6, (window.innerWidth * 0.14) / size());
      const gap = () => size() * 0.35; // each word's distance from the centre in the lockup
      const centreY = () => stage.current!.offsetHeight * 0.5 - (row.offsetTop + row.offsetHeight / 2);
      const off = (el: HTMLElement) => window.innerWidth / 2 / scale() + el.offsetWidth + 24;

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage.current,
          start: "top top",
          end: "+=150%",
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          const p = tl.progress();
          const hit = p >= 0.5;
          if (distance.current) distance.current.textContent = `${pad(Math.round(100 * (1 - Math.min(p / 0.5, 1))), 3)}%`;
          if (impact.current) impact.current.textContent = hit ? " · Impact" : "";
          readout.classList.toggle(styles.hit, hit);
        },
      });

      // 0 → 0.5: the words close in from the edges and touch at the centre
      tl.fromTo(row, { y: centreY, scale }, { y: centreY, scale, duration: 0.55 }, 0)
        .fromTo(art, { x: () => -off(art) }, { x: gap, duration: 0.5 }, 0)
        .fromTo(web, { x: () => off(web) }, { x: () => -gap(), duration: 0.5 }, 0)
        // 0.5: the impact
        .fromTo(q(`.${styles.flash}`), { opacity: 0 }, { opacity: 1, duration: 0.02 }, 0.5)
        .to(q(`.${styles.flash}`), { opacity: 0, duration: 0.08 }, 0.52)
        // (the ring's fade is separate from its growth, so before the impact it stays invisible,
        // scrolling down or back up)
        .fromTo(q(`.${styles.ring}`), { scale: 0.15 }, { scale: 1.8, duration: 0.12 }, 0.5)
        .fromTo(q(`.${styles.ring}`), { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0.5)
        .to(q(`.${styles.ring}`), { opacity: 0, duration: 0.11 }, 0.51)
        .to(row, { keyframes: { x: [0, -12, 9, -5, 3, 0] }, duration: 0.06 }, 0.5)
        .fromTo(q(`.${styles.seam}`), { scaleY: 0, opacity: 1 }, { scaleY: 1, duration: 0.06 }, 0.5)
        .to(q(`.${styles.seam}`), { opacity: 0.45, duration: 0.2 }, 0.58)
        // 0.55 → 0.8: "collide." breaks out; the words settle into the lockup, the × between them
        .fromTo(q("[data-part=collide]"), { opacity: 0, scale: 0.6, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.24 }, 0.56)
        .to(row, { y: 0, scale: 1, duration: 0.25 }, 0.55)
        .to([art, web], { x: 0, duration: 0.25 }, 0.55)
        .fromTo(q(`.${styles.times}`), { opacity: 0 }, { opacity: 1, duration: 0.1 }, 0.66)
        // 0.8 → 1: hold the finished frame a little before the page moves on
        .to({}, { duration: 0.2 }, 0.8);
    },
    { scope: root },
  );

  const { image } = manifesto;

  return (
    <section id="manifesto" ref={root} className={styles.manifesto} aria-labelledby="manifesto-title">
      <h2 id="manifesto-title" className={styles.srOnly}>
        {thesis.lead} {thesis.art} and {thesis.web} {thesis.end}
      </h2>

      <div ref={stage} className={styles.stage} data-part="stage">
        <div className={styles.label}>
          <ModuleLabel n="00" text="Manifesto" />
        </div>
        <p className={styles.readout} data-part="readout" aria-hidden="true">
          Distance <b ref={distance}>000%</b>
          <span ref={impact}> · Impact</span>
        </p>

        <div className={styles.flash} aria-hidden="true" />
        <i className={styles.ring} aria-hidden="true" />
        <Seam className={styles.seam} />

        <div className={styles.row} aria-hidden="true">
          <span className={styles.art} data-part="art">
            {thesis.art}
          </span>
          <span className={styles.times}>×</span>
          <span className={styles.web} data-part="web">
            {thesis.web}
          </span>
        </div>
        <p className={styles.collide} data-part="collide" aria-hidden="true">
          <i>{thesis.end}</i>
        </p>
        <Folio page={2} />
      </div>

      <div className={styles.after}>
        <ol className={styles.lines}>
          {manifesto.lines.map((l, i) => (
            <li key={i} data-part="line">
              <span className={styles.num}>{pad(i + 1)}</span>
              <p>
                <DecryptedText text={l} delay={i * 250} duration={1500} encryptedClassName={styles.encrypted} />
              </p>
            </li>
          ))}
        </ol>
        <ArtSlot
          fig={image.fig}
          src={image.src || undefined}
          alt={image.alt}
          sizes="(max-width: 900px) 100vw, 22vw"
          className={styles.slot}
        />
      </div>
    </section>
  );
}
