"use client";

import { Fragment, useRef } from "react";
import Image from "next/image";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { projects, writeup, type Member, type Project } from "@/data/projects";
import Seam from "./motifs/Seam";
import ArtSlot from "./motifs/ArtSlot";
import Folio from "./motifs/Folio";
import ModuleLabel from "./motifs/ModuleLabel";
import styles from "./Work.module.css";

// Decoration drawn behind a project's placeholder until a real screenshot exists
function Decor({ p }: { p: Project }) {
  if (p.art === "docs") {
    return (
      <>
        <div className={`${styles.doc} ${styles.docBack}`} />
        <div className={`${styles.doc} ${styles.docFront}`}>
          <span style={{ width: "60%", height: 8, background: "var(--line-3)" }} />
          <span />
          <span style={{ width: "80%" }} />
          <span style={{ width: "85%" }} />
          <span style={{ width: "50%" }} />
          <i />
        </div>
      </>
    );
  }
  return (
    <>
      {p.art === "grid" ? <div className={styles.grid} /> : <div className={styles.floor} />}
      {p.art === "floor" && (
        <>
          <div className={styles.barA} />
          <div className={styles.barB} />
        </>
      )}
      {p.art === "grid" && (
        <div className={styles.pixels} aria-hidden="true">
          {Array.from({ length: 48 }, (_, i) => {
            const r = Math.floor(i / 8);
            const c = i % 8;
            const on = (r + c) % 2 === 0 && c >= r;
            return <i key={i} style={{ background: on ? (c % 3 === 0 ? "var(--muted)" : "var(--accent)") : "transparent" }} />;
          })}
        </div>
      )}
    </>
  );
}

// One party row; with a GitHub profile the whole row links to it
function PartyMember({ m }: { m: Member }) {
  const body = (
    <>
      {m.avatar ? (
        <Image
          src={m.avatar}
          alt=""
          width={36}
          height={36}
          className={`${styles.avatarImg} ${m.me ? styles.avatarImgMe : ""}`}
        />
      ) : (
        <span className={`${styles.avatar} ${m.me ? styles.avatarMe : ""} ${m.open ? styles.avatarOpen : ""}`}>
          {m.initials}
        </span>
      )}
      <span className={`${styles.memberName} ${m.open ? styles.muted : ""}`}>
        {m.name}
        {m.login && <small>@{m.login}</small>}
      </span>
      {/* wraps between the "·" parts, never inside one ("System design" stays together) */}
      <span className={styles.role}>
        {m.role.split(" · ").map((part, i) => (
          <Fragment key={part}>
            {i > 0 && " · "}
            <span className={styles.rolePart}>{part}</span>
          </Fragment>
        ))}
      </span>
    </>
  );
  return m.href ? (
    <a href={m.href} target="_blank" rel="noreferrer" className={`${styles.member} ${styles.memberLink}`}>
      {body}
    </a>
  ) : (
    <div className={styles.member}>{body}</div>
  );
}

export default function Work({ parties }: { parties: Record<string, Member[]> }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.utils.toArray<HTMLElement>(`.${styles.row}`).forEach((row) => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: row, start: "top 78%" },
          defaults: { ease: "power3.out" },
        });
        tl.fromTo(
          row.querySelector(`.${styles.media}`),
          { clipPath: "inset(0 100% 0 0)" },
          { clipPath: "inset(0 0% 0 0)", duration: 1.2, ease: "power4.inOut" },
        )
          .from(row.querySelector(`.${styles.mediaInner}`), { scale: 1.08, duration: 1.6 }, 0)
          .from(row.querySelector(`.${styles.seam}`), { scaleX: 0, scaleY: 0, duration: 1.2, ease: "power4.inOut" }, 0)
          .from(row.querySelectorAll(`.${styles.reveal}`), { y: 28, opacity: 0, duration: 0.8, stagger: 0.07 }, 0.35);
      });
    },
    { scope: root },
  );

  return (
    <section id="work" ref={root} className={styles.work}>
      <div className={styles.sheet}>Sheet 01 / 05 ——— Selected projects, 2025–2026</div>
      <header className={`section-head ${styles.head}`}>
        <div>
          <ModuleLabel n="01" text="Selected work" />
          <h2>Work</h2>
        </div>
        <div className={styles.headAside}>
          <p>Designed and built end to end, from database schema to scroll animation.</p>
        </div>
      </header>

      <div className={styles.list}>
        {projects.map((p) => (
          <article key={p.id} className={styles.row}>
            {/* art page: the picture */}
            <div className={styles.media}>
              <div className={styles.mediaInner}>
                <ArtSlot
                  fig={p.figure}
                  label={p.placeholder}
                  src={p.image}
                  alt={p.imageAlt ?? `${p.title} screenshot`}
                  sizes="(max-width: 900px) 100vw, 58vw"
                  className={styles.slot}
                >
                  <Decor p={p} />
                </ArtSlot>
              </div>
            </div>

            <Seam direction="auto" className={styles.seam} />

            {/* web page: how it was built */}
            <div className={`${styles.body} web-grid`}>
              <div className={`${styles.meta} ${styles.reveal}`}>
                <span className={`outline-num ${styles.num}`}>{p.id}</span>
                <span className={p.statusDashed ? styles.statusDashed : styles.status}>
                  {p.statusDashed ? p.status : `${p.year} · ${p.status}`}
                </span>
              </div>
              <h3 className={`${styles.title} ${styles.reveal}`}>{p.title}</h3>
              <p className={`${styles.desc} ${styles.reveal}`}>{p.description}</p>
              <div className={`${styles.stack} ${styles.reveal}`}>
                <span>Stack</span>
                <span>{p.stack}</span>
              </div>

              <div className={`${styles.party} ${styles.reveal}`}>
                <span className={styles.partyLabel}>Party{p.repo && <em> · from GitHub</em>}</span>
                {(parties[p.id] ?? p.party).map((m) => (
                  <PartyMember key={m.login ?? m.name} m={m} />
                ))}
              </div>

              <div className={`${styles.actions} ${styles.reveal}`}>
                {p.links.map((l) => {
                  // other sites (live demo, GitHub) open in a new tab
                  const external = l.href.startsWith("http");
                  return (
                    <a
                      key={l.label}
                      href={l.href}
                      className={`btn ${l.solid ? "btn-solid" : ""}`}
                      {...(external && { target: "_blank", rel: "noreferrer" })}
                    >
                      {l.label}
                    </a>
                  );
                })}
              </div>
            </div>
          </article>
        ))}

        <a href={writeup.href} className={styles.writeup}>
          <span className={`outline-num ${styles.num}`}>{writeup.id}</span>
          <div className={styles.writeupText}>
            <span className="section-label">{writeup.kicker}</span>
            <span className={styles.writeupTitle}>{writeup.title}</span>
          </div>
          <pre className={`code-deco ${styles.writeupCode}`} aria-hidden="true">
            <span className="c">{"// reader.tsx"}</span>
            {"\n"}
            <span className="k">type</span> Mode = <span className="s">&quot;scroll&quot;</span> |{" "}
            <span className="s">&quot;paged&quot;</span>;{"\n"}
            <span className="k">return</span> mode === <span className="s">&quot;scroll&quot;</span>
            {"\n  ? <"}
            <span className="f">VerticalReader</span>
            {" />\n  : <"}
            <span className="f">PagedReader</span>
            {" />;"}
          </pre>
          <span className={styles.writeupArrow}>↗</span>
        </a>
      </div>
      <Folio page={3} />
    </section>
  );
}
