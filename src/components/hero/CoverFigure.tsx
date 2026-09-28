import Image from "next/image";
import { cover } from "@/data/site";
import Glitch from "../hud/Glitch";
import Tag from "../hud/Tag";
import styles from "./CoverFigure.module.css";

// The centre of the cover: the portrait cut out (or a placeholder outline until the photo
// arrives, or the hero video when given as children), standing in front of the name, unframed,
// with glitch pixels and tags pointing at it.
// data-layer attributes are the hooks Hero's GSAP timelines animate.
export default function CoverFigure({ children }: { children?: React.ReactNode }) {
  const { portrait, tags } = cover;
  return (
    <div className={styles.figure}>
      <div className={styles.portrait} data-layer="portrait">
        {children ??
          (portrait.src ? (
            <Image
              src={portrait.src}
              alt={portrait.alt}
              fill
              loading="eager"
              fetchPriority="high"
              // the box is 3:4 and ~78% of the hero's height (64% on phones), so size it by height
              sizes="(max-width: 900px) max(365px, 48vh), max(527px, 59vh)"
              className={styles.photo}
            />
          ) : (
            <div className={styles.placeholder} role="img" aria-label="Portrait coming soon">
              <svg viewBox="0 0 300 400" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
                <path d="M150 40c34 0 58 28 58 64s-24 70-58 70-58-34-58-70 24-64 58-64Z" />
                <path d="M30 400c4-110 50-170 120-190 70 20 116 80 120 190" />
              </svg>
              <span>[ your portrait ]</span>
            </div>
          ))}
        <Glitch />
      </div>
      <div className={styles.tags} data-layer="tags">
        {tags.map((t) => (
          <Tag key={t.label} {...t} />
        ))}
      </div>
    </div>
  );
}
