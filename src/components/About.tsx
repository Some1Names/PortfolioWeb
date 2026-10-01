"use client";

import { Fragment, useRef, useState } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { about, site, manifesto } from "@/data/site";
import Cutout from "./motifs/Cutout";
import Seam from "./motifs/Seam";
import Folio from "./motifs/Folio";
import ModuleLabel from "./motifs/ModuleLabel";
import Crosshairs from "./hud/Crosshairs";
import DecryptedText from "./reactbits/DecryptedText";
import DitherVeil from "./reactbits/DitherVeil";
import GlassSurface from "./reactbits/GlassSurface";
import styles from "./About.module.css";

export default function About() {
  const root = useRef<HTMLElement>(null);
  // the live dither veil runs (false: no WebGL 2 here, so the still white-dot picture instead)
  const [veilOn, setVeilOn] = useState(true);

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
      gsap.to(`.${styles.pic}`, { y: -8, duration: 3, ease: "sine.inOut", yoyo: true, repeat: -1 });
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
  // the manifesto, as one paragraph with its closing line set apart
  const credo = manifesto.lines.slice(0, -1).join(" ");
  const credoEnd = manifesto.lines[manifesto.lines.length - 1];
  const art = about.portrait;
  // no picture set (src ""): the name, a.k.a. and school stand on their own
  const hasArt = art.src !== "";
  // the frame's handles: the corners and the edge midpoints (% of the picture)
  const handles = [[0, 0], [50, 0], [100, 0], [100, 50], [100, 100], [50, 100], [0, 100], [0, 50]];

  return (
    <section id="about" ref={root} className={styles.about}>
      <Crosshairs />
      <div className={styles.glow} aria-hidden="true" />
      <div className={`${styles.grid} web-grid`} aria-hidden="true" />

      <figure
        className={`${styles.still} ${!hasArt ? styles.stillBare : `${styles.stillPic} ${art.mode === "screen" ? styles.stillScreen : styles.stillAlpha}`}`}
        style={hasArt ? ({ "--ratio": art.ratio } as React.CSSProperties) : undefined}
      >
        {hasArt && (
          // the picture in its own shape, with a Photoshop selection being transformed around it:
          // marching ants, square handles, and the figure's name over its corner like a layer's. The
          // picture is a pane of liquid glass with you on it in white dots (React Bits' Dither Veil:
          // the pointer reveals the grayscale photo underneath)
          <span className={styles.pic}>
            <GlassSurface className={styles.glass} borderRadius={14} backgroundOpacity={0.12} saturation={1.2}>
              {art.veil && veilOn ? (
                <DitherVeil
                  src={art.veil}
                  label={art.alt}
                  className={styles.veil}
                  pixelSize={3}
                  inkColor="#0a0a0c"
                  paperColor="#f2f0f7"
                  contrast={1.4}
                  brightness={0.2}
                  revealRadius={140}
                  onUnavailable={() => setVeilOn(false)}
                />
              ) : (
                <Cutout src={art.src} alt={art.alt} mode={art.mode} sizes="(max-width: 900px) 100vw, 45vw" className={styles.art} />
              )}
            </GlassSurface>
            <span className={styles.frame} data-part="frame" aria-hidden="true">
              {handles.map(([x, y]) => (
                <i key={`${x}-${y}`} className={styles.handle} style={{ left: `${x}%`, top: `${y}%` }} data-part="handle" />
              ))}
            </span>
            <span className={styles.layer} data-part="label">
              {art.fig}
            </span>
          </span>
        )}
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
        {/* the manifesto, darkroom style: mono capitals that decrypt as they scroll in */}
        <p className={styles.manifesto} data-part="manifesto">
          <DecryptedText text={credo} duration={2200} encryptedClassName={styles.encrypted} />
          <DecryptedText
            text={credoEnd}
            delay={1900}
            duration={700}
            className={styles.credoEnd}
            encryptedClassName={styles.encrypted}
          />
        </p>
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
      <Folio page={3} />
    </section>
  );
}
