import Image from "next/image";
import { cover, site } from "@/data/site";
import Glitch from "../hud/Glitch";
import Tag from "../hud/Tag";
import FaceScan from "./FaceScan";
import styles from "./CoverFigure.module.css";

// The centre of the cover: the portrait cut out (or a placeholder outline until the photo
// arrives, or the hero video when given as children), standing in front of the name, unframed,
// with glitch pixels and tags pointing at it. With the photo's face box given, desktop shows a
// face scan instead (brackets around the face, the tags hanging off it); phones keep the tags.
// data-layer attributes are the hooks Hero's GSAP timelines animate.
export default function CoverFigure({ children }: { children?: React.ReactNode }) {
  const { portrait, tags } = cover;
  const scan = !children && !!portrait.src && !!portrait.face;
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
              // the box is 3:4 and ~78% of the hero's height (64% on phones), and the picture is
              // drawn --zoom times it (CoverFigure.module.css), so size it by height
              sizes="(max-width: 900px) calc(75vh + 75px), max(1001px, 112vh)"
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
        {scan && portrait.face ? <FaceScan face={portrait.face} tags={tags} subject={site.name} /> : null}
        <Glitch />
      </div>
      <div className={`${styles.tags} ${scan ? styles.tagsPhone : ""}`} data-layer="tags">
        {tags.map((t) => (
          <Tag key={t.label} {...t} />
        ))}
      </div>
    </div>
  );
}
