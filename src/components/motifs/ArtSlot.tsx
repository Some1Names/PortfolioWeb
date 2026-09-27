import Image from "next/image";
import styles from "./Motifs.module.css";

type Props = {
  fig?: string; // caption in art pink, e.g. "Fig. A — Art"
  label?: string; // placeholder tag until the real drawing exists; "" hides it
  src?: string; // a drawing in public/, e.g. "/art/manifesto.webp"
  alt?: string;
  sizes?: string;
  className?: string;
  children?: React.ReactNode; // extra decoration drawn behind the placeholder tag
};

// Every artwork slot on the site: a hatched placeholder now, the real drawing later.
export default function ArtSlot({
  fig,
  label = "[ your drawing ]",
  src,
  alt = "",
  sizes = "50vw",
  className = "",
  children,
}: Props) {
  return (
    <figure className={`${styles.slot} ${src ? "" : `${styles.slotEmpty} hatch`} ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} className={styles.slotImg} />
      ) : (
        <>
          {children}
          {label && <span className={styles.slotTag}>{label}</span>}
        </>
      )}
      {fig && <figcaption className={`fig-art ${styles.slotFig}`}>{fig}</figcaption>}
    </figure>
  );
}
