import { icons, marks } from "@/data/logos";
import styles from "./Logo.module.css";

// A tool's mark: its Simple Icons logo, a pixel sprite, or a monogram badge. It is a 1em square,
// so size it with font-size (via className or a parent). Always decorative: the tool's name is
// written next to it (or in an aria-label), so the mark is aria-hidden.
export default function Logo({ name, className = "" }: { name: string; className?: string }) {
  const mark = marks[name] ?? { mono: name.slice(0, 2) };
  if ("icon" in mark && icons[mark.icon]) {
    return (
      <svg viewBox="0 0 24 24" className={`${styles.logo} ${className}`} aria-hidden="true">
        <path d={icons[mark.icon]} />
      </svg>
    );
  }
  if ("pixel" in mark) {
    const on = [1, 2, 4, 7, 8, 11, 13, 14]; // a tiny 4×4 sprite
    return (
      <svg viewBox="0 0 24 24" className={`${styles.logo} ${className}`} aria-hidden="true">
        {on.map((i) => (
          <rect key={i} x={(i % 4) * 6} y={Math.floor(i / 4) * 6} width="6" height="6" />
        ))}
      </svg>
    );
  }
  return (
    <span className={`${styles.logo} ${styles.mono} ${className}`} aria-hidden="true">
      <span className={styles.monoText}>{"mono" in mark ? mark.mono : name.slice(0, 2)}</span>
    </span>
  );
}
