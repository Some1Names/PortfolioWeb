import { inspiration } from "@/data/inspiration";
import { cover } from "@/data/site";
import SysTime from "../hud/SysTime";
import styles from "./Masthead.module.css";

const pad = (n: number) => String(n).padStart(2, "0");

// The page's header, cyber-brutalist: a hard grid of bordered cells like a spec sheet. System
// readouts along the top (the volume, the file, the index, a live Bangkok clock); the title huge
// in mono capitals with pink and blue ghosts and a scan line; the intro with a blinking cursor;
// two index cells that jump to the sections (their counts, in brackets, come from the data); a
// barcode, the cover's coordinates and a status light along the bottom.
export default function Masthead() {
  const [kind, volume] = inspiration.label.split(" · ");
  const tapes = inspiration.shelf.items.length;
  const records = inspiration.music.tracks.length;
  const [lat, lon] = cover.coords.split(" / ");

  return (
    <header className={styles.head}>
      <div className={styles.grid} data-part="masthead">
        <div className={styles.cell}>
          {kind}
          <b>{volume}</b>
        </div>
        <div className={styles.cell}>
          File
          <b>002 / {inspiration.title}</b>
        </div>
        <div className={styles.cell}>
          Index
          <b>Sections ({pad(2)})</b>
        </div>
        <div className={styles.cell}>
          SYS_TIME
          <b>
            <SysTime /> · UTC+7
          </b>
        </div>

        {/* the ghosts sit outside the h1 (stacked in the same grid cell), so the heading's text is
            just the title */}
        <div className={`${styles.cell} ${styles.titleCell}`}>
          <span className={`${styles.title} ${styles.ghostPink}`} aria-hidden="true">
            {inspiration.title}
          </span>
          <span className={`${styles.title} ${styles.ghostBlue}`} aria-hidden="true">
            {inspiration.title}
          </span>
          <h1 className={styles.title}>{inspiration.title}</h1>
        </div>

        <div className={`${styles.cell} ${styles.introCell}`}>
          <p className={styles.intro}>
            {inspiration.intro}
            <span className={styles.cursor} aria-hidden="true" />
          </p>
        </div>
        <a href="#shelf" className={`${styles.cell} ${styles.index}`}>
          01 — {inspiration.shelf.label}
          <b>Tapes ({pad(tapes)}) →</b>
        </a>
        <a href="#music" className={`${styles.cell} ${styles.index}`}>
          02 — {inspiration.music.label}
          <b>Records ({pad(records)}) →</b>
        </a>

        <div className={`${styles.cell} ${styles.barcodeCell}`} aria-hidden="true">
          <span className={styles.barcode} />
          UF—INSP—002
        </div>
        <div className={styles.cell}>
          {lat}
          <b>{lon}</b>
        </div>
        <div className={`${styles.cell} ${styles.status}`}>
          <i className={styles.light} aria-hidden="true" />
          <span>
            Status
            <b>Curating</b>
          </span>
        </div>
      </div>
    </header>
  );
}
