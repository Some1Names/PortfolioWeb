import Image from "next/image";
import styles from "./Motifs.module.css";

const MODE = { fade: styles.cutoutFade, screen: styles.cutoutScreen, alpha: styles.cutoutAlpha };

// A picture with no frame. "fade" dissolves its edges into the page, "screen" drops a black
// background (objects shot on pure black) and "alpha" is for cut-outs with a transparent background.
// "screen" only blends with what's behind it inside the nearest stacking context: if a parent
// has a transform/opacity/filter (e.g. a GSAP entrance), set mix-blend-mode: screen on that parent.
export default function Cutout({
  src,
  alt,
  mode = "fade",
  sizes = "50vw",
  className = "",
  priority,
}: {
  src: string;
  alt: string;
  mode?: keyof typeof MODE;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span className={`${styles.cutout} ${MODE[mode]} ${className}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={styles.cutoutImg} />
    </span>
  );
}
