import styles from "./Hud.module.css";

// Four L-shaped corner marks inside a positioned parent: a target, not a frame.
export default function Brackets({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`${styles.brackets} ${className}`} style={{ "--b": `${size}px` } as React.CSSProperties} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
