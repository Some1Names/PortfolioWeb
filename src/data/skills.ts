import type { Side } from "./site";

export type Skill = {
  name: string;
  usedIn: string; // where you actually used it: shown on the node
  why: string; // why / what you used it for: shown in the card when the node is clicked
};

// A library shipped with: the branch's "items", shown as logo chips beside its label and listed
// in the details card. Logos come from src/data/logos.ts (by name).
export type Item = { name: string; usedIn: string };

export type Branch = {
  name: string;
  side: Side; // art (pink), web (blue) or collide (violet): colours the branch
  skills: Skill[]; // left to right = learning order; past 4, the desktop tree scrolls sideways
  // libraries shipped with on this branch (from the package.json files of YafuuGallery,
  // PirahusNext and this site)
  items: Item[];
  nextQuest: string; // suggestion shown on the locked node
};

// the player class shown in the stats bar and on the star map's player card
export const playerClass = "Web dev / Motion";

export const branches: Branch[] = [
  {
    name: "Frontend",
    side: "web",
    skills: [
      {
        name: "HTML & CSS",
        usedIn: "Pirahus · YafuuGallery",
        why: "The base of every page: semantic markup and layouts. Tailwind on both projects, hand-written CSS Modules on this site.",
      },
      {
        name: "TypeScript",
        usedIn: "Pirahus · YafuuGallery",
        why: "Strict mode everywhere. Typed domain models plus Zod schemas catch bad data at the API instead of in the UI.",
      },
      {
        name: "React",
        usedIn: "Pirahus · YafuuGallery",
        why: "Component-first UI. Each PirahusNext minigame keeps its logic in its own hook or reducer; the manga reader is one client component.",
      },
      {
        name: "Next.js",
        usedIn: "Pirahus · YafuuGallery",
        why: "App Router on both projects and this site. Pages and API routes live in one codebase, so a feature ships as one change.",
      },
    ],
    items: [
      { name: "Tailwind CSS", usedIn: "Pirahus · YafuuGallery" },
      { name: "Motion", usedIn: "Pirahus" },
      { name: "React Hook Form", usedIn: "Pirahus · YafuuGallery" },
      { name: "Zod", usedIn: "Pirahus · YafuuGallery" },
      { name: "Lucide", usedIn: "Pirahus · YafuuGallery" },
      { name: "Vitest", usedIn: "YafuuGallery" },
      { name: "next-intl", usedIn: "YafuuGallery" },
    ],
    nextQuest: "Suggest: testing",
  },
  {
    name: "Motion & 3D",
    side: "collide",
    skills: [
      {
        name: "GSAP",
        usedIn: "Pirahus",
        why: "Timeline-based motion: the PirahusNext loader and home page, and every entrance on this site. Sequencing CSS can't do.",
      },
      {
        name: "ScrollTrigger",
        usedIn: "Pirahus",
        why: "Scroll-driven scenes: the pinned zoom-out hero on PirahusNext and the pinned hero here, scrubbed to the scrollbar.",
      },
      {
        name: "Three.js / R3F",
        usedIn: "Pirahus",
        why: "Real-time backgrounds on PirahusNext (Dither, Silk, PixelBlast), dropped in as React components with React Three Fiber.",
      },
      {
        name: "WebGL shaders",
        usedIn: "Pirahus",
        why: "Give each page its own mood: a different shader background per page on PirahusNext, and Light Rays and Silk on this site.",
      },
    ],
    // (React Three Fiber isn't listed: it's the "Three.js / R3F" skill above)
    items: [
      { name: "React Bits", usedIn: "Pirahus · this site" },
      { name: "Lenis", usedIn: "YafuuGallery · this site" },
      { name: "OGL", usedIn: "Pirahus · this site" },
    ],
    nextQuest: "Suggest: GLSL",
  },
  {
    name: "Data",
    side: "web",
    skills: [
      {
        name: "PostgreSQL",
        usedIn: "Pirahus · YafuuGallery",
        why: "Relational data on both: mentors, mentees and hints on PirahusNext; manga, arcs, chapters and translations on YafuuGallery.",
      },
      {
        name: "Prisma",
        usedIn: "Pirahus · YafuuGallery",
        why: "Type-safe queries and versioned migrations: users, manga, chapters, comments, bookmarks and reading progress.",
      },
      {
        name: "Zustand",
        usedIn: "Pirahus",
        why: "One small store for the signed-in user, so login, the shop, the menu and the minigames share it without prop drilling.",
      },
      {
        name: "Vercel",
        usedIn: "Pirahus · YafuuGallery",
        why: "Hosting for both projects: PirahusNext and YafuuGallery are live on Vercel.",
      },
    ],
    items: [
      { name: "Better Auth", usedIn: "YafuuGallery" },
      { name: "AWS S3", usedIn: "YafuuGallery" },
      { name: "Resend", usedIn: "YafuuGallery" },
      { name: "Axios", usedIn: "Pirahus · YafuuGallery" },
      { name: "JWT", usedIn: "Pirahus" },
    ],
    nextQuest: "Suggest: auth",
  },
  {
    name: "Design",
    side: "art",
    skills: [
      {
        name: "Clip Studio Paint",
        usedIn: "Manga art",
        why: "My main drawing app: sketching, inking and colouring my manga art.",
      },
      { name: "Photoshop", usedIn: "Graphics · photos", why: "Graphic design and photo editing." },
      { name: "Illustrator", usedIn: "Logos", why: "Creating logos, as vectors so they stay sharp at any size." },
      { name: "Premiere Pro", usedIn: "Video", why: "Video editing." },
      {
        name: "Figma",
        usedIn: "UI · wireframes",
        why: "UI design and wireframes: laying out the screens of my web projects before building them.",
      },
    ],
    items: [],
    nextQuest: "Suggest: After Effects",
  },
];

// Achievements: certificates, shown as unlocked cards under the skill tree.
// The image lives in public/certificates/ (an image, not the PDF, so the file's metadata isn't published).
export type Achievement = {
  title: string;
  program: string;
  issuer: string;
  date: string;
  image: string;
  side: Side;
};

export const achievements: Achievement[] = [
  {
    title: "KIRO Challenge",
    program: "AWS Generative AI Foundation Program",
    issuer: "The Enterprise Resources Training (ERT) · AWS",
    date: "31 Aug 2026",
    image: "/certificates/aws-genai-kiro-challenge-2026.jpg",
    side: "collide",
  },
];

// Draws a dashed "synergy" link between two nodes: [branchIndex, skillIndex]
export const synergy = { from: [0, 2] as const, to: [1, 2] as const, label: "Synergy: R3F" };
