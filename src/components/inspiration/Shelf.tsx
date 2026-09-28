"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { Favourite } from "@/data/inspiration";
import { shelfItems, middleIndex, stepIndex, type ShelfFilter } from "./tapes";
import styles from "./Shelf.module.css";

const FILTERS: { id: ShelfFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "movie", label: "Movies" },
  { id: "anime", label: "Anime" },
];

// Films and anime as VHS tapes on a shelf. The chosen tape is pulled out in the middle as its
// case (the poster, with the case and a pink sleeve behind it); the rest stand as spines made
// from their posters. Every tape carries both, so the chosen one widens and its spine fades into
// the case, and the row slides to keep it centred. Browse with the arrows, the ← → keys (with the
// shelf focused), a click on a spine, or a swipe. The shelf is finite: the arrows stop at the ends.
export default function Shelf({ items }: { items: Favourite[] }) {
  const [filter, setFilter] = useState<ShelfFilter>("all");
  const list = shelfItems(items, filter);
  const [index, setIndex] = useState(() => middleIndex(items.length));
  const at = Math.min(index, list.length - 1);
  const current = list[at];
  const go = (delta: number) => setIndex((i) => stepIndex(i, delta, list.length));
  const show = (f: ShelfFilter) => {
    setFilter(f);
    setIndex(middleIndex(shelfItems(items, f).length));
  };

  // a horizontal swipe (touch or pen) steps the shelf
  const swipe = useRef<number | null>(null);

  return (
    <div className={styles.shelf}>
      <div className={styles.filters} role="group" aria-label="Show">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => show(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <div
        className={styles.row}
        tabIndex={0}
        aria-label="Shelf of films and anime: use the arrow keys to browse"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            go(e.key === "ArrowRight" ? 1 : -1);
          }
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") swipe.current = e.clientX;
        }}
        onPointerUp={(e) => {
          const from = swipe.current;
          swipe.current = null;
          if (from !== null && Math.abs(e.clientX - from) > 40) go(e.clientX < from ? 1 : -1);
        }}
      >
        {/* keyed by filter: a new filter builds a new row, already centred */}
        <ol key={filter} className={styles.track} style={{ "--f": at } as React.CSSProperties}>
          {list.map((it, i) => {
            const on = i === at;
            return (
              <li key={it.title} className={`${styles.tape} ${on ? styles.on : ""}`}>
                <button
                  type="button"
                  className={styles.spine}
                  onClick={() => setIndex(i)}
                  aria-label={`Show ${it.title}`}
                  aria-hidden={on || undefined}
                  tabIndex={on ? -1 : undefined}
                >
                  <Image src={it.cover} alt="" fill sizes="64px" className={styles.spineArt} />
                  <span className={styles.spineYear} aria-hidden="true">
                    {it.year}
                  </span>
                  <span className={styles.spineTitle} aria-hidden="true">
                    {it.title}
                  </span>
                  <span className={styles.wear} aria-hidden="true" />
                </button>
                <a
                  href={it.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.case}
                  aria-label={`${it.title} on TMDB`}
                  aria-hidden={!on || undefined}
                  tabIndex={on ? undefined : -1}
                >
                  <span className={styles.sleeve} aria-hidden="true" />
                  <span className={styles.caseBack} aria-hidden="true" />
                  <span className={styles.front}>
                    <Image src={it.cover} alt={it.alt} fill sizes="(max-width: 900px) 180px, 260px" className={styles.poster} />
                    <span className={styles.wear} aria-hidden="true" />
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>

      <div className={styles.info}>
        <button type="button" className={styles.arrow} onClick={() => go(-1)} disabled={at === 0} aria-label="Previous">
          ←
        </button>
        <div key={current.title} className={styles.caption} aria-live="polite">
          <p className={styles.title}>{current.title}</p>
          <p className={styles.original}>{current.original ?? current.by}</p>
          <p className={styles.year}>{current.kind === "anime" ? `${current.year} · ${current.by}` : current.year}</p>
        </div>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => go(1)}
          disabled={at === list.length - 1}
          aria-label="Next"
        >
          →
        </button>
      </div>
    </div>
  );
}
