// The ambient colour of a piece of art (a poster, an album cover), for the Inspiration page's glows.
// The art is scaled down through Next's image server (same origin, so its pixels can be read),
// averaged with the weight on saturated, mid-bright pixels (so a poster's accent wins over its
// black background and white type), then pulled into the site's palette: a hue that's already
// blue-violet-pink (220°–330°) is kept, any other moves to the nearer end (warm → pink, green →
// blue), at a saturation and lightness that glow on the dark page. The pure parts are tested.

type RGB = [number, number, number];

const toHex = ([r, g, b]: RGB) =>
  "#" + [r, g, b].map((v) => Math.round(Math.min(Math.max(v, 0), 255)).toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string): RGB => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;

function toHsl([r, g, b]: RGB): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}
function fromHsl(h: number, s: number, l: number): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

export const hueOf = (hex: string) => toHsl(fromHex(hex))[0];

// the weighted average colour of RGBA pixels, or null when there's nothing to go on
// (black, grey or transparent art)
export function pickColor(data: Uint8ClampedArray): string | null {
  let r = 0;
  let g = 0;
  let b = 0;
  let w = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const [R, G, B] = [data[i], data[i + 1], data[i + 2]];
    const max = Math.max(R, G, B);
    const min = Math.min(R, G, B);
    const chroma = (max - min) / 255;
    const light = (max + min) / 510;
    const weight = chroma * chroma * (1 - Math.abs(2 * light - 1));
    r += R * weight;
    g += G * weight;
    b += B * weight;
    w += weight;
  }
  return w < 0.5 ? null : toHex([r / w, g / w, b / w]);
}

const BLUE = 220;
const PINK = 330;
const gap = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

// a colour pulled into the palette, as a glow
export function toPalette(hex: string): string {
  const [h, s] = toHsl(fromHex(hex));
  const hue = h >= BLUE && h <= PINK ? h : gap(h, BLUE) < gap(h, PINK) ? BLUE : PINK;
  return toHex(fromHsl(hue, Math.min(Math.max(s, 0.55), 0.85), 0.62));
}

// the palette colour of a piece of art, read once per image (null if it can't be read)
const cache = new Map<string, Promise<string | null>>();
export function artColor(src: string): Promise<string | null> {
  let found = cache.get(src);
  if (!found) {
    found = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width = c.height = 32;
          const ctx = c.getContext("2d", { willReadFrequently: true });
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, 32, 32);
          const picked = pickColor(ctx.getImageData(0, 0, 32, 32).data);
          resolve(picked && toPalette(picked));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = `/_next/image?url=${encodeURIComponent(src)}&w=64&q=75`;
    });
    cache.set(src, found);
  }
  return found;
}
