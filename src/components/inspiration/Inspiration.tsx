"use client";

import { inspiration } from "@/data/inspiration";
import ModuleLabel from "../motifs/ModuleLabel";
import EndBand from "../motifs/EndBand";
import Crosshairs from "../hud/Crosshairs";
import Shelf from "./Shelf";
import RecordPlayer from "./RecordPlayer";
import styles from "./Inspiration.module.css";

// The supplement: a header, the VHS shelf of films and anime, the record player, and a footer with
// credits.
const { model } = inspiration;

export default function Inspiration() {
  return (
    <div className={styles.page}>
      <header className={`${styles.head} web-grid`}>
        <Crosshairs />
        <span className={styles.kicker}>{inspiration.label}</span>
        <h1 className={styles.title}>{inspiration.title}</h1>
        <p className={styles.intro}>{inspiration.intro}</p>
      </header>

      <section id="shelf" aria-label={inspiration.shelf.label} className={styles.group}>
        <ModuleLabel n="01" text={inspiration.shelf.label} />
        <Shelf items={inspiration.shelf.items} />
      </section>

      <section id="music" aria-label={inspiration.music.label} className={styles.group}>
        <ModuleLabel n="02" text={inspiration.music.label} />
        <RecordPlayer tracks={inspiration.music.tracks} />
      </section>

      <footer className={styles.foot}>
        <p className={styles.credits}>
          {inspiration.credits} Turntable: <a href={model.href}>“{model.title}”</a> by{" "}
          <a href={model.authorHref}>{model.author}</a>, <a href={model.licenseHref}>{model.license}</a> ({model.changes}).
        </p>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full load on purpose: Lenis and the hero pin set up on load (see Nav) */}
        <a href="/" className={styles.back}>
          ← Back to the issue
        </a>
      </footer>
      <EndBand />
    </div>
  );
}
