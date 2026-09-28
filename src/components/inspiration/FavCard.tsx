"use client";

import { useState } from "react";
import Image from "next/image";
import type { Favourite, FavGroup } from "@/data/inspiration";
import CutPanel from "../hud/CutPanel";
import Brackets from "../hud/Brackets";
import styles from "./Inspiration.module.css";

const SIDE = { art: styles.sideArt, web: styles.sideWeb, collide: styles.sideCollide };

// One favourite: its cover, title, year and creator. The whole card links to the page the cover
// came from (TMDB or Apple Music), in a new tab. A text cover sits under the image: it shows while
// a slow cover loads, and in place of one that fails (the image is dropped on error).
export default function FavCard({ fav, group }: { fav: Favourite; group: FavGroup }) {
  const [broken, setBroken] = useState(false);
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
        <span className={`${styles.textCover} hatch`} data-part="text-cover" aria-hidden="true">
          {fav.title}
        </span>
        {!broken && (
          <Image
            src={fav.cover}
            alt={fav.alt}
            fill
            sizes="(max-width: 900px) 50vw, 260px"
            className={styles.coverImg}
            onError={() => setBroken(true)}
          />
        )}
        {fav.tag && <span className={styles.chip}>{fav.tag}</span>}
        <Brackets size={18} className={styles.cardBrackets} />
      </span>
      <span className={styles.cardTitle}>{fav.title}</span>
      <span className={styles.meta}>
        {fav.year} · {fav.by}
      </span>
      {fav.note && <span className={styles.note}>{fav.note}</span>}
    </CutPanel>
  );
}
