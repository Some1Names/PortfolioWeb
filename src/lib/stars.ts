// Deterministic star field so server and client render the same thing.
export function starField(n: number, w: number, h: number, seed: number) {
  const out: { x: number; y: number; d: number; o: number }[] = [];
  let s = seed;
  const next = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = 0; i < n; i++) {
    const a = next();
    const b = next();
    const c = next();
    out.push({ x: a * w, y: b * h, d: c > 0.85 ? 2 : 1, o: +(0.15 + c * 0.45).toFixed(2) });
  }
  return out;
}
