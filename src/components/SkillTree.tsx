"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { branches, synergy, achievements } from "@/data/skills";
import Logo from "./motifs/Logo";
import { projects } from "@/data/projects";
import Folio from "./motifs/Folio";
import ModuleLabel from "./motifs/ModuleLabel";
import Crosshairs from "./hud/Crosshairs";
import styles from "./SkillTree.module.css";

// sets --side for everything inside a branch: pink, blue or violet
const SIDE = { art: styles.sideArt, web: styles.sideWeb, collide: styles.sideCollide };

// Layout of the desktop tree, in a coordinate space 590 units tall (scaled with the container).
// VIEW_W units fill the visible width. A branch with more than 4 skills makes the canvas wider
// than that, and the tree scrolls sideways. The details panel sits to the right.
// Rows are 136 apart: a 96-unit node, then 40 for the next branch's label and its item chips.
const VIEW_W = 1040;
const H = 590;
const NODE_W = 150;
const NODE_H = 96;
const ROOT = { x: 20, y: 230, w: 170, h: 130 };
const TRUNK_X = 225;
const ROWS = [52, 188, 324, 460];
const STUB = 28;
const MAX = Math.max(4, ...branches.map((b) => b.skills.length));
const COLS = Array.from({ length: MAX }, (_, i) => 255 + i * 190);
const STUB_X = COLS[MAX - 1] + NODE_W + 20;
const W = STUB_X + STUB + 17; // = VIEW_W while every branch has 4 skills or fewer
const WIDE = W > VIEW_W;

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

type Picked = { b: number; s: number };
const DEFAULT_PICK: Picked = { b: 0, s: 3 };

export default function SkillTree() {
  const root = useRef<HTMLElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  // null = closed (only possible on mobile, where the panel is a dismissible card)
  const [picked, setPicked] = useState<Picked | null>(DEFAULT_PICK);
  // wide tree: scrolled all the way right (flips the scroll button to ←)
  const [atEnd, setAtEnd] = useState(false);
  const onTreeScroll = () => {
    const el = scroller.current;
    if (el) setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  };
  // a node clicked while half off the edge slides fully into view (sideways only, the page stays put)
  const reveal = (node: HTMLElement) => {
    const el = scroller.current;
    if (!el) return;
    const n = node.getBoundingClientRect();
    const f = el.getBoundingClientRect();
    if (n.right > f.right) el.scrollBy({ left: n.right - f.right + 64, behavior: "smooth" });
    else if (n.left < f.left) el.scrollBy({ left: n.left - f.left - 24, behavior: "smooth" });
  };

  const paths = useMemo(() => {
    const rootMidY = ROOT.y + ROOT.h / 2;
    const main: string[] = [];
    const locked: string[] = [];
    branches.forEach((br, r) => {
      const cy = ROWS[r] + NODE_H / 2;
      main.push(`M${ROOT.x + ROOT.w} ${rootMidY}H${TRUNK_X}V${cy}H${COLS[0]}`);
      br.skills.forEach((_, c) => {
        if (c < br.skills.length - 1) main.push(`M${COLS[c] + NODE_W} ${cy}H${COLS[c + 1]}`);
      });
      const lastX = COLS[br.skills.length - 1] + NODE_W;
      locked.push(`M${lastX} ${cy}H${STUB_X}`);
    });
    const [fb, fs] = synergy.from;
    const [tb] = synergy.to;
    const syn = `M${COLS[fs] + NODE_W / 2} ${ROWS[fb] + NODE_H}V${ROWS[tb]}`;
    return { main, locked, syn, synLabel: { x: COLS[fs] + NODE_W / 2 + 8, y: (ROWS[fb] + NODE_H + ROWS[tb]) / 2 - 6 } };
  }, []);

  const total = branches.reduce((n, b) => n + b.skills.length + 1, 0);
  const unlocked = branches.reduce((n, b) => n + b.skills.length, 0);
  const equipped = branches.reduce((n, b) => n + b.items.length, 0);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({ scrollTrigger: { trigger: `.${styles.tree}`, start: "top 70%" } });
      const lines = gsap.utils.toArray<SVGPathElement>(`.${styles.line}`);
      lines.forEach((l) => {
        const len = l.getTotalLength();
        gsap.set(l, { strokeDasharray: len, strokeDashoffset: len });
      });
      tl.from(`.${styles.root}`, { scale: 0.8, opacity: 0, duration: 0.6, ease: "back.out(2)" })
        .to(lines, { strokeDashoffset: 0, duration: 1.2, ease: "power2.inOut", stagger: 0.03 }, 0.2);
      // one step per column, then the locked stubs (data-step = MAX)
      Array.from({ length: MAX + 1 }, (_, i) => i).forEach((step) => {
        tl.from(
          `[data-step="${step}"]`,
          { opacity: 0, scale: 0.85, duration: 0.45, ease: "back.out(1.8)", stagger: 0.06 },
          0.45 + step * 0.18,
        );
      });
      tl.from(`.${styles.dashed}`, { opacity: 0, duration: 0.6 }, 1.2);
    },
    { scope: root },
  );

  const shown = picked ?? DEFAULT_PICK;
  const branch = branches[shown.b];
  const sel = branch.skills[shown.s];
  const selProjects = projects.filter((p) =>
    sel.usedIn.toLowerCase().includes(p.title.split(" ")[0].toLowerCase().slice(0, 5)),
  );

  return (
    <section id="skills" ref={root} className={styles.skills}>
      <Crosshairs />
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.grid} aria-hidden="true" />

      <header className={styles.head}>
        <div>
          <ModuleLabel n="04" text="Skill tree" />
          <h2>Skills</h2>
        </div>
        <div className={styles.legend}>
          <span>
            <i className={styles.legendOpen} />
            Unlocked
          </span>
          <span>
            <i className={styles.legendLocked} />
            Locked
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
          <span className={styles.hint}>Click a skill{WIDE && " · scroll sideways for more"}</span>
        </div>
      </header>

      <div className={`${styles.stats} glass`}>
        <div>
          <span>Player</span>
          <strong className={styles.player}>Uefa</strong>
        </div>
        <div>
          <span>Class</span>
          <strong>Web dev / Motion</strong>
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

      <div className={styles.board}>
        {/* ---------- desktop tree (scrolls sideways when a branch has more than 4 skills) ---------- */}
        <div className={`${styles.treeWrap} ${WIDE && !atEnd ? styles.treeMore : ""}`}>
          <div
            ref={scroller}
            className={styles.treeScroll}
            onScroll={WIDE ? onTreeScroll : undefined}
            data-lenis-prevent-horizontal
          >
            <div className={styles.tree} style={{ aspectRatio: `${W} / ${H}`, width: `${(W / VIEW_W) * 100}%` }}>
              <span className={styles.pathLabel} style={{ right: pct(W - STUB_X - STUB, W), top: pct(24, H) }}>
                Learning path →
              </span>

              <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
                {paths.main.map((d, i) => (
                  <path key={i} d={d} className={styles.line} vectorEffect="non-scaling-stroke" />
                ))}
                {paths.locked.map((d, i) => (
                  <path key={`l${i}`} d={d} className={styles.dashed} vectorEffect="non-scaling-stroke" />
                ))}
                <path d={paths.syn} className={styles.synergy} vectorEffect="non-scaling-stroke" />
              </svg>
              <span
                className={styles.synLabel}
                style={{ left: pct(paths.synLabel.x, W), top: pct(paths.synLabel.y, H) }}
              >
                {synergy.label}
              </span>

              <div
                className={styles.root}
                style={{ left: pct(ROOT.x, W), top: pct(ROOT.y, H), width: pct(ROOT.w, W), height: pct(ROOT.h, H) }}
              >
                <span>Root / Origin</span>
                <strong>Uefa</strong>
                <span>ACS · KMUTT</span>
              </div>

              {branches.map((br, b) => (
                <div key={br.name} className={SIDE[br.side]}>
                  <span className={styles.branchLabel} style={{ left: pct(COLS[0], W), top: pct(ROWS[b] - 22, H) }}>
                    {br.name}
                    {/* the branch's items: libraries shipped with, named on hover (and in the card) */}
                    {br.items.length > 0 && (
                      <span className={styles.items}>
                        {br.items.map((it) => (
                          <span
                            key={it.name}
                            role="img"
                            aria-label={`${it.name}, used in ${it.usedIn}`}
                            data-tip={`${it.name} · ${it.usedIn}`}
                            data-part="item"
                            className={styles.item}
                          >
                            <Logo name={it.name} className={styles.itemLogo} />
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                  {br.skills.map((sk, s) => {
                    const active = picked?.b === b && picked?.s === s;
                    return (
                      <button
                        key={sk.name}
                        data-step={s}
                        className={`${styles.node} ${active ? styles.nodeActive : ""}`}
                        style={{ left: pct(COLS[s], W), top: pct(ROWS[b], H), width: pct(NODE_W, W), height: pct(NODE_H, H) }}
                        onClick={(e) => {
                          setPicked({ b, s });
                          if (WIDE) reveal(e.currentTarget);
                        }}
                        aria-pressed={active}
                      >
                        <span className={styles.skillName}>
                          <Logo name={sk.name} className={styles.nodeLogo} />
                          {sk.name}
                        </span>
                        <span className={styles.used}>{sk.usedIn}</span>
                      </button>
                    );
                  })}
                  <div
                    data-step={MAX}
                    className={styles.stub}
                    style={{
                      left: pct(STUB_X, W),
                      top: pct(ROWS[b] + (NODE_H - STUB) / 2, H),
                      width: pct(STUB, W),
                      height: pct(STUB, H),
                    }}
                    title={`Locked · ${br.nextQuest}`}
                  >
                    ?
                  </div>
                </div>
              ))}
            </div>
          </div>
          {WIDE && (
            <button
              type="button"
              className={styles.treeScrollBtn}
              onClick={() => scroller.current?.scrollBy({ left: atEnd ? -W : W, behavior: "smooth" })}
              aria-label={atEnd ? "Scroll the skill tree back to the start" : "Scroll the skill tree to see more skills"}
            >
              {atEnd ? "←" : "→"}
            </button>
          )}
        </div>

        {/* ---------- details panel (card on mobile) ---------- */}
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
      </div>

      {/* ---------- mobile: one list per branch ---------- */}
      <div className={styles.mobile}>
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
