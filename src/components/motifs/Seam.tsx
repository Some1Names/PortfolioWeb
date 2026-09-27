import styles from "./Motifs.module.css";

type Props = {
  direction?: "vertical" | "horizontal" | "auto"; // auto: vertical on desktop, horizontal at 900px and below
  className?: string;
};

const DIR = { vertical: styles.y, horizontal: styles.x, auto: styles.auto };

// The line where art meets web: pink → violet → blue, with registration marks at both ends.
export default function Seam({ direction = "vertical", className = "" }: Props) {
  return (
    <div className={`${styles.seam} ${DIR[direction]} ${className}`} aria-hidden="true">
      <i className={styles.mark} />
      <i className={styles.mark} />
    </div>
  );
}
