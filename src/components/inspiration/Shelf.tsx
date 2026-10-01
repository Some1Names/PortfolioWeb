"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Favourite } from "@/data/inspiration";
import { artColor } from "@/lib/artColor";
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
// Dressed as a VCR: on-screen text in the corners, rental stickers on the chosen case, a shelf
// with the tapes reflected in it, all on a CRT screen. Beside it (under it from 1100px down), a side note on the chosen
// tape: your note, or a slot waiting for one.
export default function Shelf({ items, onShow }: { items: Favourite[]; onShow?: (title: string) => void }) {
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

  // tell the page which tape is out (the ticker between the sections shows it)
  useEffect(() => {
    onShow?.(current.title);
  }, [current.title, onShow]);

  // the screen's glow takes the chosen poster's colour (pulled into the palette)
  const [glow, setGlow] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    artColor(current.cover).then((c) => live && setGlow(c));
    return () => {
      live = false;
    };
  }, [current.cover]);

  // a horizontal swipe (touch or pen) steps the shelf
  const swipe = useRef<number | null>(null);

  return (
    <div className={styles.shelf}>
      <div
        className={styles.screen}
        data-part="screen"
        aria-hidden="true"
        style={glow ? ({ "--glow": glow } as React.CSSProperties) : undefined}
      />
      <div className={styles.main}>
        <div className={styles.filters} role="group" aria-label="Show">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => show(f.id)}>
              {f.label}
            </button>
          ))}
        </div>

        <div className={styles.stage}>
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
                        <Image
                          src={it.cover}
                          alt={it.alt}
                          fill
                          sizes="(max-width: 900px) 180px, 260px"
                          className={styles.poster}
                        />
                        <span className={styles.wear} aria-hidden="true" />
                        <span className={styles.rewind} aria-hidden="true">
                          Be kind
                          <br />
                          rewind
                        </span>
                        <span className={styles.pick} aria-hidden="true">
                          Staff pick ★
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
            <span className={styles.plank} data-part="plank" aria-hidden="true" />
          </div>
          {/* a VCR's on-screen display, in the corners */}
          <div className={styles.osd} data-part="osd" aria-hidden="true">
            <span className={styles.osdTl}>
              <i className={styles.rec} /> Play ▶
            </span>
            <span className={styles.osdTr}>
              SP · {String(at + 1).padStart(2, "0")} / {String(list.length).padStart(2, "0")}
            </span>
            <span className={styles.osdBl}>
              <Timecode key={current.title} />
            </span>
            <span className={styles.osdBr}>Hi-Fi Stereo</span>
          </div>
        </div>

        <div className={styles.info}>
          <button
            type="button"
            className={styles.arrow}
            onClick={() => go(-1)}
            disabled={at === 0}
            aria-label="Previous"
          >
            ←
          </button>
          {/* every tape's caption, stacked in one spot with only the chosen one shown, so the block
            is always as tall as the tallest and the page below doesn't move while browsing */}
          <div className={styles.captions}>
            {items.map((it) => {
              const on = it === current;
              return (
                <div
                  key={it.title}
                  className={`${styles.caption} ${on ? styles.captionOn : ""}`}
                  data-part="caption"
                  data-on={on || undefined}
                  aria-hidden={!on || undefined}
                >
                  <p className={styles.title}>{it.title}</p>
                  <p className={styles.original}>{it.original ?? it.by}</p>
                  <p className={styles.year}>{it.kind === "anime" ? `${it.year} · ${it.by}` : it.year}</p>
                </div>
              );
            })}
            <p className={styles.srOnly} aria-live="polite">
              {current.title}, {current.original ?? current.by}, {current.year}
            </p>
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

      <aside className={styles.side} aria-label="Side note">
        <p className={styles.sideLabel}>Side note</p>
        {/* every tape's note stacked in one spot, like the captions, so the column keeps its height */}
        <div className={styles.sideNotes}>
          {items.map((it) => {
            const on = it === current;
            return (
              <div
                key={it.title}
                className={`${styles.sideNote} ${on ? styles.sideNoteOn : ""}`}
                data-on={on || undefined}
                aria-hidden={!on || undefined}
              >
                <p className={styles.sideTitle}>{it.title}</p>
                {it.note ? (
                  <p className={styles.sideText}>“{it.note}”</p>
                ) : (
                  <p className={styles.sideSlot}>[ your note on {it.title} ]</p>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

// the VCR's tape counter: runs from 0:00:00 while a tape is out (keyed by the tape, so it resets)
function Timecode() {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = Math.floor(sec / 3600);
  const mm = String(Math.floor(sec / 60) % 60).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return (
    <>
      {hh}:{mm}:{ss}
    </>
  );
}
