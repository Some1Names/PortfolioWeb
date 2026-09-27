import styles from "./Hud.module.css";

// "+" registration marks at the four corners of a section (HUD edge detail).
// Place it as a direct child of a positioned section.
export default function Crosshairs() {
  return (
    <span className={styles.cross} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
