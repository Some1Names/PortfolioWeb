import styles from "./Motifs.module.css";

// The hazard-stripe band that closes a page, full width. The caller places it (margins, order).
export default function EndBand({ className = "" }: { className?: string }) {
  return <div className={`${styles.endBand} ${className}`} aria-hidden="true" />;
}
