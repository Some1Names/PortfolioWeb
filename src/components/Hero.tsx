"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { starField } from "@/lib/stars";
import { site, heroFrames, thesis } from "@/data/site";
import Seam from "./motifs/Seam";
import ArtSlot from "./motifs/ArtSlot";
import Folio from "./motifs/Folio";
import LightRays from "./reactbits/LightRays";
import TechText from "./reactbits/TechText";
import styles from "./Hero.module.css";

const stars = starField(60, 100, 72, 7);

const codeLines: React.ReactNode[] = [
  <span key="0" className="c">{"// hero.ts"}</span>,
  <>
    <span className="k">const</span> tl = gsap.<span className="f">timeline</span>({"{"}
  </>,
  <>
    {"  scrollTrigger: { pin: "}
    <span className="k">true</span>, scrub: <span className="k">1</span>
    {" }"}
  </>,
  <>{"});"}</>,
  <>
    tl.<span className="f">to</span>(frames, {"{ frame: "}
    <span className="n">89</span>
    {" })"}
  </>,
  <>
    {"  ."}
    <span className="f">to</span>(<span className="s">&quot;.name&quot;</span>, {"{ yPercent: "}
    <span className="n">-40</span>
    {" }, "}
    <span className="n">0</span>);
  </>,
];

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useGSAP(
    () => {
      const reduce = prefersReducedMotion();
      const q = gsap.utils.selector(root);

      // ---- hero video: image sequence drawn to canvas ----
      const images: HTMLImageElement[] = [];
      const frame = { i: 0 };
      const draw = () => {
        const c = canvas.current;
        const img = images[Math.round(frame.i)];
        if (!c || !img || !img.complete) return;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        const { width, height } = c.getBoundingClientRect();
        c.width = width * devicePixelRatio;
        c.height = height * devicePixelRatio;
        const s = Math.max(c.width / img.naturalWidth, c.height / img.naturalHeight);
        const w = img.naturalWidth * s;
        const h = img.naturalHeight * s;
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h);
      };
      if (heroFrames.frameCount > 0) {
        for (let i = 1; i <= heroFrames.frameCount; i++) {
          const img = new Image();
          img.src = heroFrames.path(i);
          if (i === 1) img.onload = draw;
          images.push(img);
        }
      }

      // ---- intro ----
      let intro: gsap.core.Timeline | undefined;
      if (!reduce) {
        intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .from(q(`.${styles.rays}`), { opacity: 0, duration: 2.2, ease: "power2.out" })
          .from(q(`.${styles.axis}`), { scaleY: 0, transformOrigin: "50% 0%", duration: 1.6, ease: "power3.inOut" }, 0)
          .from(q(`.${styles.name}`), { yPercent: 30, opacity: 0, duration: 1.4 }, 0.2)
          .from(q(`.${styles.fadeIn}`), { opacity: 0, y: 24, duration: 1, stagger: 0.08 }, 0.5)
          .from(q(`.${styles.codeLine}`), { opacity: 0, x: -8, duration: 0.25, stagger: 0.14, ease: "none" }, 1.1);

        // slow drift on the background ring
        gsap.to(q(`.${styles.orbit}`), { rotate: "+=360", duration: 120, repeat: -1, ease: "none" });
      }

      // ---- scroll: pin the hero, scrub frames, dissolve the name ----
      if (!reduce) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=100%",
            pin: true,
            scrub: 1,
          },
        });
        tl.to(frame, {
          i: Math.max(heroFrames.frameCount - 1, 0),
          snap: "i",
          ease: "none",
          onUpdate: draw,
        }, 0)
          .to(q(`.${styles.floor}`), { backgroundPositionY: "+=240px", ease: "none" }, 0);

        // The rays, name and panels are also animated by the intro. Their scroll tweens are added only
        // once the intro has finished, so they record the settled state (visible, in place) as
        // their start. Added earlier, they recorded the intro's hidden start, and scrolling back
        // to the top left the name and panels invisible.
        intro?.eventCallback("onComplete", () => {
          tl.to(q(`.${styles.rays}`), { opacity: 0.3, ease: "none" }, 0)
            .to(q(`.${styles.name}`), { yPercent: -40, opacity: 0, filter: "blur(12px)", ease: "none" }, 0)
            .to(q(`.${styles.driftSlow}`), { y: -24, ease: "none" }, 0)
            .to(q(`.${styles.driftFast}`), { y: -48, opacity: 0.35, ease: "none" }, 0);
        });
      }

      const onResize = () => draw();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    },
    { scope: root },
  );

  return (
    <section id="top" ref={root} className={styles.hero}>
      {/* ---------- background layers ---------- */}
      <div className={styles.bg} aria-hidden="true">
        <div className={`${styles.artZone} hatch`} />
        <div className={`${styles.webZone} web-grid`} />
        {stars.map((s, i) => (
          <span
            key={i}
            className={styles.star}
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.d, height: s.d, opacity: s.o }}
          />
        ))}
        <div className={styles.floor} />
        <div className={styles.glow} />
        <LightRays
          className={styles.rays}
          raysOrigin="top-center"
          raysColor="#f0e0ff"
          raysSpeed={0.8}
          lightSpread={1.3}
          rayLength={2.4}
          fadeDistance={1.2}
          saturation={1.1}
          mouseInfluence={0.08}
          noiseAmount={0.06}
          distortion={0.04}
        />
        <Seam className={styles.axis} />
        <div className={styles.horizon} />
        <div className={styles.circle} />
        <div className={styles.orbit} />
      </div>

      <div className={`${styles.caption} ${styles.fadeIn}`}>
        <span>Rendered at night</span>
        <span>/</span>
        <span>Built in Thailand</span>
      </div>

      {/* ---------- video frame ---------- */}
      <div className={`${styles.frame} glass ${styles.fadeIn} ${styles.driftSlow}`}>
        <i className={styles.cornerTL} />
        <i className={styles.cornerTR} />
        <i className={styles.cornerBL} />
        <i className={styles.cornerBR} />
        {heroFrames.frameCount > 0 ? (
          <canvas ref={canvas} className={styles.canvas} aria-label="Animated portrait of Uefa" />
        ) : (
          <ArtSlot
            fig={heroFrames.cover.fig}
            label="[ animated you ]"
            src={heroFrames.cover.src || undefined}
            alt={heroFrames.cover.alt}
            sizes="300px"
            className={styles.framePlaceholder}
          />
        )}
      </div>

      {/* ---------- left column: art side ---------- */}
      <div className={styles.left}>
        <div className={`${styles.panel} glass ${styles.fadeIn} ${styles.driftFast}`}>
          <div className={styles.panelHead}>Index / Portfolio {site.volume}</div>
          <p className={styles.panelBody}>{site.tagline}</p>
          <div className={styles.panelFoot}>{site.program}</div>
        </div>
        <p className={`${styles.cover} ${styles.fadeIn} ${styles.driftSlow}`}>
          {thesis.lead} <span className={styles.coverArt}>{thesis.art}</span>{" "}
          <span className={styles.coverAmp}>&amp;</span> <span className={styles.coverWeb}>{thesis.web}</span>{" "}
          <i>{thesis.end}</i>
        </p>
        <div className={`${styles.barcode} ${styles.fadeIn}`} aria-hidden="true">
          <div />
          <span>UF—2026—V01—TH</span>
        </div>
      </div>

      {/* ---------- right column: web side ---------- */}
      <div className={styles.right}>
        <dl className={`${styles.status} glass ${styles.fadeIn} ${styles.driftFast}`}>
          {site.status.map((r) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
        <pre className={`code-deco ${styles.code} ${styles.driftSlow}`} aria-hidden="true">
          {codeLines.map((l, i) => (
            <span key={i} className={styles.codeLine}>
              {l}
              {"\n"}
            </span>
          ))}
        </pre>
        <div className={`outline-num ${styles.issue} ${styles.fadeIn} ${styles.driftSlow}`} aria-hidden="true">
          01
          <br />
          26
        </div>
      </div>

      {/* the name is drawn by React Bits TechText (a scanning lens outlines and measures each
          letter; letters can be dragged). The real text stays in the heading for screen readers. */}
      <h1 className={styles.name}>
        <span className={styles.srOnly}>{site.name}</span>
        <span className={styles.nameArt} aria-hidden="true">
          <TechText
            text={site.name}
            fontWeight={400}
            fontSize={380}
            letterSpacing={-0.005}
            color="#f2f0f7"
            accentColor="#9a6bff"
            reach={220}
            dashLength={5}
            dashGap={3}
            strokeWidth={1.4}
            specks={12}
            speed={0.9}
          />
        </span>
      </h1>
      <Folio page={1} className={styles.folio} />

      {/* ---------- bottom bar ---------- */}
      <div className={`${styles.bar} glass`}>
        <a href="#work" className={styles.barCta}>
          See work ↓
        </a>
        {site.links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className={styles.barLink}>
            <span>{l.label}</span>
            <span className={styles.arrow}>↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}
