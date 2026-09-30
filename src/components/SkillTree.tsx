"use client";

import { useState } from "react";
import Image from "next/image";
import { branches, achievements, playerClass } from "@/data/skills";
import { projects, projectsUsing } from "@/data/projects";
import Logo from "./motifs/Logo";
import Folio from "./motifs/Folio";
import ModuleLabel from "./motifs/ModuleLabel";
import Crosshairs from "./hud/Crosshairs";
import ConstellationMap from "./skills/ConstellationMap";
import MiniSky from "./skills/MiniSky";
import styles from "./SkillTree.module.css";

// sets --side for everything inside a branch: pink, blue or violet
const SIDE = { art: styles.sideArt, web: styles.sideWeb, collide: styles.sideCollide };

type Picked = { b: number; s: number };
const DEFAULT_PICK: Picked = { b: 0, s: 3 };

// 04 — Skill tree. On 901px and up the skills are a 3D star map (skills/ConstellationMap, with its
// own HUD card) filling the screen, the stats bar floating on its sky. On phones, and anywhere the map can't get a canvas, they're a list per branch with
// a sticky details card. The stats bar and Achievements frame both.
export default function SkillTree() {
  // the list's card: which skill it shows (null = closed)
  const [picked, setPicked] = useState<Picked | null>(DEFAULT_PICK);
  // the star map couldn't draw: show the list at every size
  const [listMode, setListMode] = useState(false);

  const total = branches.reduce((n, b) => n + b.skills.length + 1, 0);
  const unlocked = branches.reduce((n, b) => n + b.skills.length, 0);
  const equipped = branches.reduce((n, b) => n + b.items.length, 0);

  const shown = picked ?? DEFAULT_PICK;
  const branch = branches[shown.b];
  const sel = branch.skills[shown.s];
  const selProjects = projectsUsing(sel.usedIn);

  return (
    <section id="skills" className={`${styles.skills} ${listMode ? styles.listMode : ""}`}>
      <Crosshairs />
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.grid} aria-hidden="true" />

      <header className={styles.head}>
        <div>
          <ModuleLabel n="04" text="Skill tree" />
          <h2>Skills</h2>
        </div>
      </header>

      {/* the stats bar and the star map share one sky, full screen on 901px and up (the map locks
          it in place for a while: the stage is what's pinned, its wrapper takes it edge to edge) */}
      <div className={styles.bleed}>
      <div className={styles.stage} data-part="stage">
      <div className={`${styles.stats} glass`}>
        <div>
          <span>Player</span>
          <strong className={styles.player}>Uefa</strong>
        </div>
        <div>
          <span>Class</span>
          <strong>{playerClass}</strong>
        </div>
        <div>
          <span>Projects</span>
          <strong>{projects.length} on this page</strong>
        </div>
        <div>
          <span>Skills unlocked</span>
          <strong>
            {unlocked} / {total}
          </strong>
        </div>
        <div>
          <span>Quests</span>
          <strong>2 shipped</strong>
        </div>
        <div>
          <span>Items</span>
          <strong>{equipped} equipped</strong>
        </div>
        <div>
          <span>Achievements</span>
          <strong>{achievements.length} unlocked</strong>
        </div>
      </div>

      {!listMode && <ConstellationMap onUnavailable={() => setListMode(true)} />}
      {/* the map's key, along the sky's bottom-left */}
      <div className={styles.legend}>
        <span>
          <i className={styles.legendStar} aria-hidden="true">
            ✦
          </i>
          Skill
        </span>
        <span>
          <i className={styles.legendLocked} />
          Locked
        </span>
        <span>
          <i className={styles.legendItem} />
          Item
        </span>
        <span>
          <i className={styles.legendSize} aria-hidden="true">
            <b />
            <b />
          </i>
          Bigger = learned earlier
        </span>
        <span>
          <i className={`${styles.legendSide} ${styles.sideArt}`} />
          Art
        </span>
        <span>
          <i className={`${styles.legendSide} ${styles.sideWeb}`} />
          Web
        </span>
        <span>
          <i className={`${styles.legendSide} ${styles.sideCollide}`} />
          Collide
        </span>
        <span className={styles.hint}>Click a star</span>
      </div>
      </div>
      </div>

      {/* ---------- phones (and the fallback): one list per branch ---------- */}
      <div className={styles.mobile}>
        {!listMode && <MiniSky />}
        {branches.map((br, b) => (
          <div key={br.name} className={`${styles.mBranch} ${SIDE[br.side]}`}>
            <div className={styles.mHead}>Branch / {br.name}</div>
            {br.items.length > 0 && (
              <div className={styles.mItems}>
                {br.items.map((it) => (
                  <span key={it.name} data-part="item" className={styles.mItem} title={`Used in ${it.usedIn}`}>
                    <Logo name={it.name} className={styles.mItemLogo} />
                    {it.name}
                  </span>
                ))}
              </div>
            )}
            <div className={styles.mList}>
              {br.skills.map((sk, s) => (
                <button
                  key={sk.name}
                  className={styles.mNode}
                  onClick={() => setPicked({ b, s })}
                  aria-pressed={picked?.b === b && picked?.s === s}
                >
                  <i />
                  <span>
                    <Logo name={sk.name} className={styles.mLogo} />
                    {sk.name}
                  </span>
                  <small>{sk.usedIn}</small>
                </button>
              ))}
              <div className={`${styles.mNode} ${styles.mLocked}`}>
                <i />
                <span>[ Next skill ]</span>
                <small>Locked</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- the list's details card (sticky on phones) ---------- */}
      <aside className={`${styles.panel} ${SIDE[branch.side]} ${picked ? "" : styles.panelClosed}`} aria-live="polite">
        <div className={styles.panelHead}>
          <span>Branch / {branch.name}</span>
          <button onClick={() => setPicked(null)} aria-label="Close">
            ✕
          </button>
        </div>
        <div key={`${shown.b}-${shown.s}`} className={styles.panelBody}>
          <strong className={styles.panelTitle}>
            <Logo name={sel.name} className={styles.panelLogo} />
            {sel.name}
          </strong>
          <div className={styles.panelWhy}>
            <span>What I used it for</span>
            <p className={styles.panelText}>{sel.why}</p>
          </div>
          {selProjects.length > 0 && (
            <div className={styles.panelLinks}>
              <span>Used in</span>
              {selProjects.map((p) => (
                <a key={p.id} href="#work" className="btn">
                  {p.id} · {p.title}
                </a>
              ))}
            </div>
          )}
          {branch.items.length > 0 && (
            <div className={styles.panelItems}>
              <span>Items on this branch</span>
              <ul>
                {branch.items.map((it) => (
                  <li key={it.name} data-part="panel-item" title={`Used in ${it.usedIn}`}>
                    <Logo name={it.name} className={styles.panelItemLogo} />
                    {it.name}
                    <span className={styles.srOnly}>, used in {it.usedIn}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className={styles.panelNext}>
          <span>Next quest</span>
          <strong>{branch.nextQuest}</strong>
        </div>
      </aside>

      {/* ---------- achievements: certificates, as unlocked cards ---------- */}
      <div className={styles.achievements}>
        <div className={styles.achHead}>
          <span>Achievements</span>
          <span>{achievements.length} unlocked</span>
        </div>
        {achievements.map((a) => (
          <div key={a.title} className={`${styles.achGroup} ${SIDE[a.side]}`}>
            <span className={styles.groupLabel}>Unlocked · {a.date}</span>
            <div className={styles.achList}>
              <a href={a.image} target="_blank" rel="noreferrer" className={styles.ach}>
                <span className={styles.achThumb}>
                  <Image
                    src={a.image}
                    alt={`Certificate of achievement: ${a.program}, ${a.title}`}
                    fill
                    sizes="(max-width: 900px) 90vw, 300px"
                  />
                </span>
                <span className={styles.achText}>
                  <span className={styles.achKicker}>{a.program}</span>
                  <strong className={styles.achTitle}>{a.title}</strong>
                  <span className={styles.achIssuer}>Issued by {a.issuer}</span>
                  <span className={`btn ${styles.achCta}`}>View certificate ↗</span>
                </span>
              </a>
            </div>
          </div>
        ))}
      </div>
      <Folio page={5} />
    </section>
  );
}
