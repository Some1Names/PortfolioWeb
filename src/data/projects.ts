export type Member = {
  initials: string;
  name: string;
  role: string;
  login?: string; // GitHub username
  avatar?: string; // GitHub avatar URL (filled in from the GitHub API)
  href?: string; // GitHub profile; the whole row links here
  me?: boolean;
  open?: boolean; // empty "looking for teammates" slot
};

export type Project = {
  id: string;
  title: string;
  year: string;
  status: string;
  statusDashed?: boolean;
  description: string;
  stack: string;
  figure: string;
  image?: string; // put a screenshot in public/ and set e.g. "/projects/manga.webp"
  imageAlt?: string; // what the image shows (defaults to "<title> screenshot")
  placeholder: string;
  art: "grid" | "floor" | "docs";
  // GitHub repo ("owner/name"): its contributors become the party, with avatars and profile links
  repo?: string;
  // role shown per GitHub login; contributors without one show their commit count
  roles?: Record<string, string>;
  // shown when there is no repo, or when GitHub can't be reached
  party: Member[];
  links: { label: string; href: string; solid?: boolean }[];
};

const ME = "Some1Names";
const me = (role: string): Member => ({
  initials: "UF",
  name: "Uefa",
  role,
  login: ME,
  href: `https://github.com/${ME}`,
  me: true,
});

export const projects: Project[] = [
  {
    id: "01",
    title: "PirahusNext",
    year: "2025",
    status: "Live",
    description:
      "Event platform for a university mentorship tradition, where seniors are paired with juniors as \"code siblings\": four minigames, a points shop, leaderboards and role-based admin dashboards.",
    stack: "Next.js · GSAP · R3F · Zustand",
    figure: "FIG. 1.1 — KEY VISUAL / LOGO",
    image: "/projects/pirahusnext.jpg",
    imageAlt: "PirahusNext key visual: the glowing Pirahus Next logo on a dark blue background",
    placeholder: "[ SCREENSHOT: MINIGAMES ]",
    art: "floor",
    repo: "Some1Names/PirahusNext",
    roles: { [ME]: "Idea founder · Frontend · System design" },
    party: [me("Idea founder · Frontend · System design")],
    links: [
      { label: "Live ↗", href: "https://pirahus-next.vercel.app/", solid: true },
      { label: "Code ↗", href: "https://github.com/Some1Names/PirahusNext" },
    ],
  },
  {
    id: "02",
    title: "YafuuGallery",
    year: "2026",
    status: "Shipped",
    description:
      "A multi-author manga reading platform. PDF chapters open in a reader that switches between vertical scroll and paged modes, with bookmarks, reading progress, comments and translations.",
    stack: "Next.js · TS · Prisma · Postgres",
    figure: "FIG. 2.1 — HOME / FEATURED MANGA",
    image: "/projects/yafuugallery.webp",
    imageAlt: "YafuuGallery home page: the featured manga Dome Disaster and a Continue Reading shelf",
    placeholder: "[ SCREENSHOT: MANGA READER ]",
    art: "grid",
    repo: "Some1Names/YafuuGallery",
    roles: { [ME]: "Design · Full-stack" },
    party: [me("Design · Full-stack")],
    links: [
      { label: "Live ↗", href: "https://yafuu-gallery.vercel.app/", solid: true },
      { label: "Code ↗", href: "https://github.com/Some1Names/YafuuGallery" },
    ],
  },
];

// the newest project (highest year; the first listed wins a tie), shown on the cover
export const latestProject = projects.reduce((a, b) => (Number(b.year) > Number(a.year) ? b : a));
// each project's anchor in the Work section
export const projectAnchor = (p: Project) => `project-${p.id}`;

// the projects a skill's "used in" names (matched on the start of each project's title)
export const projectsUsing = (usedIn: string) =>
  projects.filter((p) => usedIn.toLowerCase().includes(p.title.split(" ")[0].toLowerCase().slice(0, 5)));
