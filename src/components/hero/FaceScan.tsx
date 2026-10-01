import type { TagSpec } from "@/data/site";
import styles from "./FaceScan.module.css";

type Box = { x0: number; y0: number; x1: number; y1: number };

// A camera's face detection over the portrait: corner brackets around the face, a slow scan line,
// the subject's name under it and the tags hanging off its sides on short level lines. The face
// box is in fractions of the picture; this sits in the portrait layer, so it scales and moves with
// the picture. Desktop only (phones keep the cover's own tags).
export default function FaceScan({ face, tags, subject }: { face: Box; tags: TagSpec[]; subject: string }) {
  const vars = { "--x0": face.x0, "--y0": face.y0, "--x1": face.x1, "--y1": face.y1 } as React.CSSProperties;
  // the left tag hangs lower than the right one, both below the copy beside the face
  const rows = { left: 72, right: 60 };
  return (
    <div className={styles.scan} style={vars} data-layer="scan" aria-hidden="true">
      <i className={`${styles.corner} ${styles.tl}`} />
      <i className={`${styles.corner} ${styles.tr}`} />
      <i className={`${styles.corner} ${styles.bl}`} />
      <i className={`${styles.corner} ${styles.br}`} />
      <i className={styles.sweep} />
      <span className={styles.readout}>Subject · {subject}</span>
      {tags.map((t) => {
        const side = t.x > 50 ? "right" : "left";
        return (
          <span
            key={t.label}
            className={`${styles.tag} ${side === "right" ? styles.right : styles.left}`}
            style={{ "--side": `var(--${t.side ?? "collide"})`, "--row": `${rows[side]}%` } as React.CSSProperties}
          >
            <span className={styles.chip} data-part="label">
              {t.label}
            </span>
            <i className={styles.line} />
          </span>
        );
      })}
    </div>
  );
}
