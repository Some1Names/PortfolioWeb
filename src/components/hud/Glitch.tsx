import styles from "./Hud.module.css";

// Small pixel squares that flicker at the edges of a figure (pixel-art glitch). A seeded
// generator places them, so the server and the client render the same squares.
function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export default function Glitch({ count = 8, seed = 7, className = "" }: { count?: number; seed?: number; className?: string }) {
  const r = seeded(seed);
  const cells = Array.from({ length: count }, (_, i) => ({
    x: i % 2 === 0 ? r() * 18 : 82 + r() * 18, // hug the left or right edge (% of width)
    y: 15 + r() * 60,
    s: 6 + Math.round(r() * 10),
    d: (r() * 2).toFixed(2),
    art: i % 3 === 0,
  }));
  return (
    <span className={`${styles.glitch} ${className}`} aria-hidden="true">
      {cells.map((c, i) => (
        <i
          key={i}
          className={c.art ? styles.gArt : styles.gCollide}
          style={{ left: `${c.x}%`, top: `${c.y}%`, width: c.s, height: c.s, animationDelay: `${c.d}s` }}
        />
      ))}
    </span>
  );
}
