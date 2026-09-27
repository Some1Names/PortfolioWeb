import Image from "next/image";
import type { Favourite, FavGroup } from "@/data/inspiration";
import CutPanel from "../hud/CutPanel";
import styles from "./Inspiration.module.css";

const SIDE = { art: styles.sideArt, web: styles.sideWeb, collide: styles.sideCollide };

// One favourite: its cover, title, year and creator. The whole card links to the page the cover
// came from (TMDB or Apple Music), in a new tab.
export default function FavCard({ fav, group }: { fav: Favourite; group: FavGroup }) {
  return (
    <CutPanel
      as="a"
      href={fav.href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${fav.title} — opens on ${fav.source}`}
      className={`${styles.card} ${SIDE[group.side]}`}
    >
      <span className={`${styles.cover} ${group.shape === "poster" ? styles.poster : styles.square}`}>
        <Image src={fav.cover} alt={fav.alt} fill sizes="(max-width: 900px) 50vw, 260px" className={styles.coverImg} />
        {fav.tag && <span className={styles.chip}>{fav.tag}</span>}
      </span>
      <span className={styles.cardTitle}>{fav.title}</span>
      <span className={styles.meta}>
        {fav.year} · {fav.by}
      </span>
      {fav.note && <span className={styles.note}>{fav.note}</span>}
      {group.listen && <span className={styles.listen}>▶ Listen</span>}
    </CutPanel>
  );
}
