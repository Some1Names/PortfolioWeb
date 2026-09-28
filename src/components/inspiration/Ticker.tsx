import styles from "./Ticker.module.css";

// Between the two sections: a strip running "Now showing — <the chosen tape>" and "Now playing —
// <the song>" ("On the deck —" while it's paused), following your picks. Decorative (the shelf and
// the player announce their own changes), so it's hidden from screen readers.
export default function Ticker({ showing, track, playing }: { showing: string; track: string; playing: boolean }) {
  const items = (
    <>
      <span className={styles.item}>
        <b className={styles.show}>Now showing</b> — <span className={styles.title}>{showing}</span>
      </span>
      <i className={styles.star}>✦</i>
      <span className={styles.item}>
        <b className={playing ? styles.play : styles.deck}>{playing ? "Now playing" : "On the deck"}</b> —{" "}
        <span className={styles.title}>{track}</span>
      </span>
      <i className={styles.star}>✦</i>
    </>
  );
  // the track holds the run twice; moving it by -50% loops seamlessly
  return (
    <div className={styles.strip} data-part="ticker" aria-hidden="true">
      <div className={styles.track}>
        {[0, 1].map((copy) => (
          <div key={copy} className={styles.group}>
            {items}
            {items}
            {items}
          </div>
        ))}
      </div>
    </div>
  );
}
