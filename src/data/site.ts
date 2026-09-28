// Everything personal lives in src/data. Edit these files, not the components.

// Which half of "art meets web" something belongs to: colours it pink, blue or violet
// A HUD tag: a label with a pointer to a spot in its parent box. x/y is where the pointer leaves
// the label and `to` is the spot it points at, both in % of the parent (values outside 0-100 put
// the label beside the box). `phone` is where the label sits on phones (its top-left corner, no
// pointer); tags without it are hidden on phones. `wide` tags only show on screens 1400px+.
export type TagSpec = {
  label: string;
  x: number;
  y: number;
  to: { x: number; y: number };
  side?: Side;
  phone?: { x: number; y: number };
  wide?: boolean;
};

export type Side = "art" | "web" | "collide";

// The site's thesis, used on the cover and the 00 — Manifesto spread
export const thesis = { lead: "When", art: "art", web: "web", end: "collide." };

// DRAFT copy for the manifesto spread: rewrite these in your own words.
export const manifesto = {
  lines: [
    "I draw before I code. The sketch decides how a page should feel; the code decides how it behaves.",
    "A game hidden inside an event site, a manga reader, this issue: each one started as a picture and ended as a page.",
    "This is where the two meet.",
  ],
  // the image beside the manifesto: one of your drawings in public/art/, or a stand-in until then.
  // Keep "AI" in the caption while it's a generated image.
  fig: "Fig. A — Fresco × chrome · AI",
  artSrc: "/art/manifesto.webp",
  artAlt: "AI-generated image: a classical painted figure in draped robes, with liquid chrome pouring off her shoulder",
};

export const site = {
  name: "Uefa",
  volume: "Vol. 01",
  year: 2026,
  emails: [
    { label: "Work email", address: "uefapeerawit@gmail.com" },
    { label: "Personal email", address: "himarukoishiwa@gmail.com" },
  ],
  links: [
    { label: "GitHub", handle: "@Some1Names", href: "https://github.com/Some1Names" },
    { label: "Instagram", handle: "@yafuuyufaa", href: "https://instagram.com/yafuuyufaa" },
    { label: "Twitch", handle: "/yafuuyufaa", href: "https://twitch.tv/yafuuyufaa" },
  ],
  // shown as logos (see src/data/logos.ts): art tools get pink dots, web tools blue dots
  marquee: [
    { label: "Next.js", side: "web" },
    { label: "Clip Studio Paint", side: "art" },
    { label: "TypeScript", side: "web" },
    { label: "React", side: "web" },
    { label: "Tailwind CSS", side: "web" },
    { label: "Pixel art", side: "art" },
    { label: "GSAP", side: "web" },
    { label: "Three.js", side: "web" },
    { label: "React Bits", side: "web" },
    { label: "Motion", side: "web" },
    { label: "Photoshop", side: "art" },
    { label: "Prisma", side: "web" },
    { label: "PostgreSQL", side: "web" },
    { label: "Zod", side: "web" },
    { label: "Illustrator", side: "art" },
    { label: "Figma", side: "art" },
    { label: "React Hook Form", side: "web" },
    { label: "Zustand", side: "web" },
    { label: "Lenis", side: "web" },
    { label: "Premiere Pro", side: "art" },
    { label: "Better Auth", side: "web" },
    { label: "AWS S3", side: "web" },
    { label: "Resend", side: "web" },
    { label: "Vitest", side: "web" },
  ] satisfies { label: string; side: Exclude<Side, "collide"> }[],
};

export const about = {
  statement: "I build web things that feel like something.",
  highlight: "feel",
  // the image beside About: a photo of you, or a stand-in until then (floats free, no card).
  // Keep "AI" in fig while it's generated. mode "screen": a picture on pure black, the black
  // blends away. mode "alpha": a cut-out (transparent background) that stands on the signature
  // line against the page's left edge, its cut bottom edge fading out.
  portrait: {
    src: "/art/about.webp",
    mode: "screen" as "screen" | "alpha",
    fig: "Fig. 02 — Still life · AI",
    alt: "AI-generated image: an orchid made of polished chrome, dripping, on black",
  },
  body: [
    "I'm an Applied Computer Science (ACS) student at KMUTT in Thailand. Games tucked inside an event site, a manga reader I'd actually want to use, interfaces with a strong visual identity: that's the kind of work I chase.",
    "Coursework keeps me grounded in the fundamentals (algorithms, computer architecture, programming language theory), and drawing keeps me honest about design.",
  ],
  facts: [
    { label: "Studying", value: "Applied Computer Science (ACS), KMUTT" },
    { label: "Building", value: "Web apps in Next.js + TypeScript" },
    { label: "Into", value: "Game dev, UI/UX, creative coding, pixel art" },
    { label: "Find me", value: "Twitch / yafuuyufaa" },
  ],
};

// Hero video: export your clip as an image sequence into public/frames/
// named frame_0001.webp, frame_0002.webp, ... and set frameCount.
// It then plays inside the portrait box on scroll, in place of the portrait. Leave it at 0 to
// show the portrait.
export const heroFrames = {
  frameCount: 0,
  path: (i: number) => `/frames/frame_${String(i).padStart(4, "0")}.webp`,
};

// ---------- cover (hero) ----------
// The centre of the cover: you, cut out, standing in front of the name. Put a transparent
// PNG/WebP of yourself in public/art/ and set portrait.src; "" shows a placeholder outline.
// Tags point at the portrait box (see TagSpec). "wide" tags show only at 1400px+.
// Around it: the thesis headline (top left, with `intro` under it), your roles (top right, with
// `focus` under it), two small tiles (bottom left) and a card whose arrow goes to Contact
// (bottom right). In intro and focus, words between *stars* are set bold.
export const cover: {
  portrait: { src: string; alt: string };
  tags: TagSpec[];
  coords: string;
  intro: string;
  roles: string[];
  focus: string;
  tiles: { label: string; value: string }[];
  card: { label: string; value: string; foot: string };
} = {
  portrait: { src: "", alt: "Portrait of Uefa" },
  tags: [
    { label: "ACS · KMUTT", x: 106, y: 32, to: { x: 60, y: 14 }, side: "web", phone: { x: 56, y: 4 } },
    { label: "Manga artist", x: -4, y: 44, to: { x: 38, y: 22 }, side: "art", phone: { x: 16, y: 26 } },
    { label: "Motion / WebGL", x: 106, y: 52, to: { x: 66, y: 40 }, side: "collide", wide: true },
    { label: "Next.js · TS", x: -2, y: 58, to: { x: 32, y: 46 }, side: "web", wide: true },
  ],
  coords: "X_13.65 N / Y_100.49 E",
  intro: "Applied Computer Science (*ACS*) student at *KMUTT*.",
  roles: ["Manga artist", "Web developer"],
  focus: "I build web applications in *Next.js* and *TypeScript*, with a focus on motion and visual systems.",
  tiles: [
    { label: "Focus", value: "Web / Motion" },
    { label: "Stack", value: "Next.js · TS" },
  ],
  card: { label: "Status", value: "Open to internships", foot: "Year · 2026" },
};
