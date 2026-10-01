"use client";

import { useRef, useSyncExternalStore } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { onIntroDone } from "@/lib/intro";
import { starField } from "@/lib/stars";
import { site, heroFrames, cover, thesis } from "@/data/site";
import { latestProject, projectAnchor } from "@/data/projects";
import Seam from "./motifs/Seam";
import Folio from "./motifs/Folio";
import CutPanel from "./hud/CutPanel";
import SysTime from "./hud/SysTime";
import CoverFigure from "./hero/CoverFigure";
import LightRays from "./reactbits/LightRays";
import TechText from "./reactbits/TechText";
import styles from "./Hero.module.css";

const stars = starField(60, 100, 72, 7);

// wider than the phone layout: the name stands in front of you there, drawn in outline
const WIDE = "(min-width: 901px)";
const subscribeWide = (onChange: () => void) => {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const isWide = () => window.matchMedia(WIDE).matches;

// words between *stars* in the cover copy are set bold
const Bold = ({ text }: { text: string }) => <>{text.split("*").map((s, i) => (i % 2 ? <b key={i}>{s}</b> : s))}</>;

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const wide = useSyncExternalStore(subscribeWide, isWide, () => false);

  useGSAP(
    (_context, contextSafe) => {
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
          const img = new window.Image();
          img.src = heroFrames.path(i);
          if (i === 1) img.onload = draw;
          images.push(img);
        }
      }

      // ---- scroll: pin the hero, scrub frames ----
      let scroll: gsap.core.Timeline | undefined;
      if (!reduce) {
        scroll = gsap.timeline({
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=100%",
            pin: true,
            scrub: 1,
          },
        });
        scroll
          .to(frame, { i: Math.max(heroFrames.frameCount - 1, 0), snap: "i", ease: "none", onUpdate: draw }, 0)
          .to(q(`.${styles.floor}`), { backgroundPositionY: "+=240px", ease: "none" }, 0);

        // slow drift on the background ring
        gsap.to(q(`.${styles.orbit}`), { rotate: "+=360", duration: 120, repeat: -1, ease: "none" });
      }

      // ---- entrance: waits for the loading intro (if one is playing) to hand over ----
      const buildIntro = () => {
        if (reduce) return;
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .from(q(`.${styles.rays}`), { opacity: 0, duration: 2.2, ease: "power2.out" })
          .from(q(`.${styles.axis}`), { scaleY: 0, transformOrigin: "50% 0%", duration: 1.6, ease: "power3.inOut" }, 0)
          .from(q(`.${styles.name}`), { yPercent: 30, opacity: 0, duration: 1.4 }, 0.2)
          .from(q(`.${styles.fadeIn}`), { opacity: 0, y: 24, duration: 1, stagger: 0.08 }, 0.5)
          // the cover figure: you rise in, then the tag lines draw
          .from(q('[data-layer="portrait"]'), { opacity: 0, y: 24, duration: 1.2 }, 0.35)
          .from(
            q('[data-layer="tags"] [data-part="label"], [data-layer="tags"] [data-part="reticle"]'),
            { opacity: 0, duration: 0.3, stagger: 0.06 },
            1.3,
          );
        // tag lines draw out from the label to the spot they point at (end point grows from the start)
        root.current?.querySelectorAll<SVGLineElement>('[data-layer="tags"] line').forEach((line, i) => {
          intro.from(
            line,
            { attr: { x2: line.getAttribute("x1") ?? 0, y2: line.getAttribute("y1") ?? 0 }, duration: 0.6, ease: "power2.inOut" },
            1.1 + i * 0.1,
          );
        });
        // The rays, name and panels are also animated by the entrance. Their scroll tweens are added
        // only once it has finished, so they record the settled state (visible, in place) as their
        // start. Added earlier, they recorded the hidden start, and scrolling back to the top left
        // the name and panels invisible.
        intro.eventCallback("onComplete", () => {
          scroll
            ?.to(q(`.${styles.rays}`), { opacity: 0.3, ease: "none" }, 0)
            .to(q(`.${styles.name}`), { yPercent: -40, opacity: 0, filter: "blur(12px)", ease: "none" }, 0)
            .to(q(`.${styles.driftFast}`), { y: -48, opacity: 0.35, ease: "none" }, 0)
            // cover depth: the portrait stays standing on the bottom edge while the tags drift up
            // past it (8%, as far as they used to move relative to it)
            .to(q('[data-layer="tags"]'), { yPercent: -8, ease: "none" }, 0);
        });
      };
      // contextSafe keeps tweens made later (after the hand-over) in this component's cleanup
      const stopWaiting = onIntroDone(contextSafe ? contextSafe(buildIntro) : buildIntro);

      const onResize = () => draw();
      window.addEventListener("resize", onResize);
      return () => {
        stopWaiting();
        window.removeEventListener("resize", onResize);
      };
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
        <div className={styles.halftone} />
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

      <div className={`${styles.caption} ${styles.fadeIn}`} data-hero="caption">
        <span>Rendered at night</span>
        <span>/</span>
        <span>Built in Thailand</span>
      </div>

      {/* the name is drawn by React Bits TechText (a scanning lens outlines and measures each
          letter; letters can be dragged). The real text stays in the heading for screen readers.
          On desktop it takes the roles title's place, top right, solid; a letter you hold turns
          into its outline (the lens only measures there). On phones it stays behind you. */}
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
            reveal={wide ? "off" : "letter"}
            holdOutline
            lineStyle={wide ? "solid" : "dashed"}
            align={wide ? "end" : "center"}
          />
        </span>
      </h1>

      {/* ---------- the cover figure: you, cut out, in front of the name ---------- */}
      <CoverFigure>
        {heroFrames.frameCount > 0 ? (
          <canvas ref={canvas} className={styles.canvas} aria-label="Animated portrait of Uefa" />
        ) : undefined}
      </CoverFigure>

      {/* ---------- top corners, like a magazine cover's issue details ---------- */}
      <div className={`${styles.barcode} ${styles.cornerLeft} ${styles.fadeIn}`} data-hero="barcode" aria-hidden="true">
        <div />
        <span>UF—2026—V01—TH</span>
      </div>
      <div className={`${styles.readout} ${styles.cornerRight} ${styles.fadeIn}`} data-hero="readout">
        <span>{cover.coords}</span>
        <span>
          SYS_TIME <SysTime /> · UTC+7
        </span>
      </div>

      {/* ---------- under the small print: the thesis (left) and your roles (right) ---------- */}
      <div className={`${styles.intro} ${styles.fadeIn} ${styles.driftFast}`} data-hero="intro">
        <p className={styles.headline}>
          {thesis.lead} <span className={styles.art}>{thesis.art}</span> <br />
          and <span className={styles.web}>{thesis.web}</span> <br />
          {thesis.end}
        </p>
        <p className={styles.blurb}>
          <Bold text={cover.intro} />
        </p>
        <a href="#work" className={`btn btn-solid ${styles.cta}`}>
          See my work →
        </a>
      </div>
      {/* on desktop the name stands where the roles title was (the title stays for screen readers) */}
      <div className={`${styles.roles} ${styles.fadeIn} ${styles.driftFast}`} data-hero="roles">
        <p className={styles.rolesTitle}>
          {cover.roles.map((r) => (
            <span key={r}>{r}</span>
          ))}
        </p>
        <p className={styles.blurb}>
          <Bold text={cover.focus} />
        </p>
      </div>

      {/* ---------- bottom corners: your newest project (left) and the status card (right) ---------- */}
      <CutPanel className={`${styles.card} ${styles.cardLeft} ${styles.fadeIn} ${styles.driftFast}`} data-hero="latest">
        <div className={styles.cardText}>
          <span className={styles.cardLabel}>Latest work</span>
          <span className={styles.cardValue}>{latestProject.title}</span>
          <span className={styles.cardLabel}>
            {latestProject.year} · {latestProject.status}
          </span>
        </div>
        <a href={`#${projectAnchor(latestProject)}`} className={styles.cardArrow} aria-label={`See ${latestProject.title}`}>
          ↗
        </a>
      </CutPanel>
      <CutPanel
        corners="tr-bl"
        className={`${styles.card} ${styles.cardRight} ${styles.fadeIn} ${styles.driftFast}`}
        data-hero="card"
      >
        <div className={styles.cardText}>
          <span className={styles.cardLabel}>{cover.card.label}</span>
          <span className={styles.cardValue}>{cover.card.value}</span>
          <span className={styles.cardLabel}>{cover.card.foot}</span>
        </div>
        <a href="#contact" className={styles.cardArrow} aria-label="Get in touch">
          ↗
        </a>
      </CutPanel>

      <Folio page={1} className={styles.folio} />
    </section>
  );
}
