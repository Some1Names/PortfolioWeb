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
  tagline:
    "Applied Computer Science (ACS) student at KMUTT. I build web applications in Next.js and TypeScript, with a focus on motion and visual systems.",
  program: "Applied Computer Science · KMUTT",
  status: [
    { label: "Status", value: "Open to internships" },
    { label: "Focus", value: "Web / Motion" },
    { label: "Stack", value: "Next.js · TS" },
    { label: "Year", value: "2026" },
  ],
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
  // the About frame: a photo or self-portrait of you, or a stand-in until then.
  // For a real portrait use label "Portrait", fig "Fig. 02 — Art" and alt "Portrait of Uefa".
  portrait: {
    src: "/art/about.webp",
    label: "Still life",
    fig: "Fig. 02 — Chrome orchid · AI",
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
// Leave it at 0 to show the still cover image instead.
export const heroFrames = {
  frameCount: 0,
  path: (i: number) => `/frames/frame_${String(i).padStart(4, "0")}.webp`,
  cover: {
    src: "/art/hero-cover.webp",
    fig: "Fig. 00 — Cover · AI",
    alt: "AI-generated image: a marble hand and a liquid-chrome hand reaching for each other, fingertips almost touching",
  },
};
