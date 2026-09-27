import type { TagSpec } from "@/data/site";
import styles from "./Hud.module.css";

const SIDE = { art: styles.sideArt, web: styles.sideWeb, collide: styles.sideCollide };

// HUD callout: a cut-corner label with a leader line to a reticle on the spot it names.
// Positions are % of the positioned parent, so it stays aimed at the same spot at any size.
// data-part hooks let GSAP draw the line and fade the label in.
export default function Tag({ label, x, y, to, side = "collide", phone, wide, className = "" }: TagSpec & { className?: string }) {
  const vars = {
    "--x": `${x}%`,
    "--y": `${y}%`,
    "--px": `${phone?.x ?? 0}%`,
    "--py": `${phone?.y ?? 0}%`,
  } as React.CSSProperties;
  return (
    <span
      className={`${styles.tag} ${SIDE[side]} ${wide ? styles.tagWide : ""} ${phone ? "" : styles.tagNoPhone} ${className}`}
      style={vars}
    >
      <svg className={styles.tagLine} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <line x1={x} y1={y} x2={to.x} y2={to.y} pathLength={1} vectorEffect="non-scaling-stroke" />
      </svg>
      <i className={styles.reticle} style={{ left: `${to.x}%`, top: `${to.y}%` }} data-part="reticle" aria-hidden="true" />
      <span className={`${styles.tagLabel} ${x <= to.x ? styles.tagLabelLeft : ""}`} data-part="label">
        {label}
      </span>
    </span>
  );
}
