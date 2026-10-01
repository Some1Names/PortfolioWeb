"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { Track } from "@/data/inspiration";
import { artColor } from "@/lib/artColor";
import { playerReducer, initialPlayer, formatTime, type PlayerAction, type PlayerState } from "./player";
import Turntable from "./Turntable";
import Threads from "../reactbits/Threads";
import styles from "./RecordPlayer.module.css";

// the previews are mastered loud: they play at 35% (the element keeps it as the track changes)
const VOLUME = 0.35;

// The music section: a turntable (left) and the record library (right). It plays Apple Music's
// 30-second previews; nothing plays until someone presses play or picks a track. When a clip
// ends the next one starts, stopping after the last unless repeat is on. A clip that won't load
// leaves its "Apple Music ↗" link as the way to listen.
export default function RecordPlayer({
  tracks,
  onDeck,
}: {
  tracks: Track[];
  onDeck?: (title: string, playing: boolean) => void;
}) {
  const [s, dispatch] = useReducer(
    (st: PlayerState, a: PlayerAction) => playerReducer(st, a, tracks.length),
    initialPlayer,
  );
  const audio = useRef<HTMLAudioElement>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [failed, setFailed] = useState<number[]>([]);
  const track = tracks[s.index];
  const broken = failed.includes(s.index);

  // the threads take the album cover's colour (pulled into the palette)
  const [ambient, setAmbient] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    artColor(track.cover).then((c) => live && setAmbient(c));
    return () => {
      live = false;
    };
  }, [track.cover]);

  // tell the page what's on the deck and whether it plays (the ticker between the sections shows it)
  useEffect(() => {
    onDeck?.(track.title, s.playing);
  }, [track.title, s.playing, onDeck]);

  useEffect(() => {
    if (audio.current) audio.current.volume = VOLUME;
  }, []);

  // a clip (re)starts: from the top
  useEffect(() => {
    const a = audio.current;
    if (a && s.seq > 0) a.currentTime = 0;
  }, [s.seq]);
  // play / pause. The browser may refuse to play; then the player shows paused. (An AbortError
  // only means a newer clip replaced this one before it started, so it is ignored.)
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (s.playing) a.play().catch((err: Error) => err.name !== "AbortError" && dispatch({ type: "pause" }));
    else a.pause();
  }, [s.playing, s.seq]);

  const seek = (t: number) => {
    const a = audio.current;
    if (!a) return;
    a.currentTime = t;
    setTime(t);
  };
  const p = duration ? Math.min(time / duration, 1) : 0;

  return (
    <div
      className={styles.player}
      data-state={s.playing ? "playing" : "paused"}
      data-index={s.index}
      data-ambient={ambient ?? undefined}
    >
      {/* over the deck: React Bits Threads, swelling while a track plays */}
      <Threads
        className={styles.threads}
        color={ambient ?? "#9a6bff"}
        amplitude={s.playing ? 1.5 : 0.5}
        distance={0.25}
      />
      <div className={styles.deck}>
        <Turntable cover={track.cover} playing={s.playing} progress={p} />

        {/* over the record's faded lower half, like a player's now-playing bar */}
        <div className={styles.overlay}>
          <div className={styles.now}>
            <p className={styles.nowTitle} aria-live="polite">
              {track.title}
            </p>
            <p className={styles.nowArtist}>
              {track.artist}
              {track.tag && <span className={styles.tag}> · {track.tag}</span>}
            </p>
          </div>

          <div className={styles.progress}>
            <span>{formatTime(time)}</span>
            <input
              type="range"
              className={styles.seek}
              min={0}
              max={duration}
              step={0.1}
              value={Math.min(time, duration)}
              onChange={(e) => seek(Number(e.target.value))}
              aria-label="Seek"
              aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
              style={{ "--p": `${p * 100}%` } as React.CSSProperties}
              disabled={broken}
            />
            <span>{formatTime(duration)}</span>
          </div>

          <div className={styles.controls}>
            <a
              href={track.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctrl}
              aria-label={`${track.title} on Apple Music`}
            >
              <Icon d="M7 17 17 7M9 7h8v8" />
            </a>
            <button
              type="button"
              className={styles.ctrl}
              onClick={() => dispatch({ type: "prev" })}
              aria-label="Previous track"
            >
              <Icon d="M7 6v12M18 6l-9 6 9 6z" fill />
            </button>
            <button
              type="button"
              className={`${styles.ctrl} ${styles.play}`}
              onClick={() => dispatch({ type: "toggle" })}
              aria-label={s.playing ? "Pause" : "Play"}
              disabled={broken}
            >
              {s.playing ? <Icon d="M8 5h3v14H8zM13 5h3v14h-3z" fill /> : <Icon d="M8 5v14l11-7z" fill />}
            </button>
            <button
              type="button"
              className={styles.ctrl}
              onClick={() => dispatch({ type: "next" })}
              aria-label="Next track"
            >
              <Icon d="M17 6v12M6 6l9 6-9 6z" fill />
            </button>
            <button
              type="button"
              className={`${styles.ctrl} ${styles.repeat}`}
              onClick={() => dispatch({ type: "repeat" })}
              aria-label="Repeat this track"
              aria-pressed={s.repeat}
            >
              <Icon d="M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4" />
            </button>
          </div>
          <p className={styles.note}>
            {broken ? (
              <>
                Preview unavailable ·{" "}
                <a href={track.href} target="_blank" rel="noopener noreferrer">
                  Listen on Apple Music ↗
                </a>
              </>
            ) : (
              "30-sec preview · Apple Music"
            )}
          </p>
        </div>
      </div>

      <div className={styles.library}>
        <div className={styles.libraryHead}>
          <p>Record library</p>
          <span>Tracks ({String(tracks.length).padStart(2, "0")})</span>
        </div>
        <ol className={styles.list}>
          {tracks.map((t, i) => {
            const current = i === s.index && s.seq > 0;
            return (
              <li key={t.title}>
                <button
                  type="button"
                  className={styles.row}
                  onClick={() => dispatch({ type: "select", index: i })}
                  aria-current={current ? "true" : undefined}
                  aria-label={`${current && s.playing ? "Pause" : "Play"} ${t.title} by ${t.artist}`}
                >
                  <span className={styles.num}>
                    {current && s.playing ? (
                      <span className={styles.eq} aria-hidden="true">
                        <i />
                        <i />
                        <i />
                      </span>
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </span>
                  <span className={styles.rowText}>
                    <span className={styles.rowTitle}>{t.title}</span>
                    <span className={styles.rowArtist}>
                      {t.artist}
                      {t.tag && <span className={styles.tag}> · {t.tag}</span>}
                    </span>
                  </span>
                  <span className={styles.len}>{formatTime(t.length)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <audio
        ref={audio}
        src={track.preview}
        preload="none"
        onLoadStart={() => setTime(0)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 30)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onEnded={() => dispatch({ type: "ended" })}
        // paused from outside the page (headphones unplugged, the system's media keys)
        onPause={(e) => !e.currentTarget.ended && dispatch({ type: "pause" })}
        onError={() => {
          setFailed((f) => (f.includes(s.index) ? f : [...f, s.index]));
          dispatch({ type: "pause" });
        }}
      />
    </div>
  );
}

function Icon({ d, fill = false }: { d: string; fill?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className={fill ? undefined : styles.stroke}>
      <path d={d} />
    </svg>
  );
}
