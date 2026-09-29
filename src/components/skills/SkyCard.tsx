import type { Ref } from "react";
import Logo from "../motifs/Logo";
import DecryptedText from "../reactbits/DecryptedText";
import { branches, playerClass } from "@/data/skills";
import { site } from "@/data/site";
import { projectsUsing } from "@/data/projects";
import type { Side } from "./constellation";
import styles from "./Constellation.module.css";

export type CardView = { kind: "skill"; b: number; s: number } | { kind: "planet" };

const SIDE = { art: styles.sideArt, web: styles.sideWeb, collide: styles.sideCollide };

// The star map's HUD card: a skill (what it was used for, where, the branch's items and next quest)
// or, from the planet, the player card with the owner's name. It keeps showing the last view while
// it slides out; closed, it's hidden from screen readers.
export default function SkyCard({
  ref,
  view,
  open,
  side,
  onClose,
}: {
  ref?: Ref<HTMLDivElement>;
  view: CardView | null;
  open: boolean;
  side: Side;
  onClose: () => void;
}) {
  const tint = view?.kind === "skill" ? SIDE[branches[view.b].side] : "";
  return (
    <div
      ref={ref}
      data-part="card"
      data-open={open}
      aria-hidden={!open}
      className={`${styles.card} ${side === "right" ? styles.cardRight : styles.cardLeft} ${open ? styles.cardOpen : ""} ${tint}`}
    >
      <div className={styles.cardInner} aria-live="polite">
        {view?.kind === "skill" && <SkillCard b={view.b} s={view.s} onClose={onClose} />}
        {view?.kind === "planet" && <PlayerCard onClose={onClose} />}
      </div>
    </div>
  );
}

function Close({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" onClick={onClose} aria-label="Back to the full map">
      ✕
    </button>
  );
}

function SkillCard({ b, s, onClose }: { b: number; s: number; onClose: () => void }) {
  const br = branches[b];
  const sk = br.skills[s];
  const links = projectsUsing(sk.usedIn);
  return (
    <>
      <div className={styles.cardHead}>
        <span>Branch / {br.name}</span>
        <Close onClose={onClose} />
      </div>
      <div key={`${b}-${s}`} className={styles.cardBody}>
        <strong className={styles.cardTitle}>
          <Logo name={sk.name} className={styles.cardLogo} />
          {sk.name}
        </strong>
        <div className={styles.cardBlock}>
          <span>What I used it for</span>
          <p>{sk.why}</p>
        </div>
        {links.length > 0 && (
          <div className={styles.cardLinks}>
            <span>Used in</span>
            {links.map((p) => (
              <a key={p.id} href="#work" className="btn">
                {p.id} · {p.title}
              </a>
            ))}
          </div>
        )}
        {br.items.length > 0 && (
          <div className={styles.cardBlock}>
            <span>Items on this branch</span>
            <ul className={styles.cardItems}>
              {br.items.map((it) => (
                <li key={it.name} data-part="card-item" title={`Used in ${it.usedIn}`}>
                  <Logo name={it.name} className={styles.itemLogo} />
                  {it.name}
                  <span className={styles.srOnly}>, used in {it.usedIn}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className={styles.cardNext} data-part="next">
        <span>Next quest</span>
        <strong>{br.nextQuest}</strong>
      </div>
    </>
  );
}

function PlayerCard({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className={styles.cardHead}>
        <span>Origin / Player</span>
        <Close onClose={onClose} />
      </div>
      <div key="planet" className={styles.cardBody}>
        <strong className={styles.playerName}>
          <DecryptedText text={site.name} duration={900} encryptedClassName={styles.encrypted} />
        </strong>
        <span className={styles.playerReal}>{site.realName}</span>
        <span className={styles.playerAka}>
          <b>a.k.a.</b> {site.aka.join(" · ")}
        </span>
        <dl className={styles.playerFacts}>
          <div>
            <dt>Class</dt>
            <dd>{playerClass}</dd>
          </div>
          <div>
            <dt>Base</dt>
            <dd>ACS · KMUTT</dd>
          </div>
        </dl>
      </div>
    </>
  );
}
