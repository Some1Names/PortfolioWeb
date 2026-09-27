import type { Side } from "./site";

// Which side a tag belongs to: Art = pink, Code/Project = blue, Now = violet.
// Tags not listed here (Life, Study, ...) stay lavender.
export const tagSide: Record<string, Side | undefined> = {
  Art: "art",
  Code: "web",
  Project: "web",
  Now: "collide",
};

// MOCK DATA: replace every entry with your real milestones.
export const timeline = [
  { year: "2006", title: "Chapter 00", note: "Born in Thailand. Placeholder entry.", tag: "Life" },
  { year: "2018", title: "First digital drawings", note: "Picked up Clip Studio Paint and started drawing seriously.", tag: "Art" },
  { year: "2020", title: "First website", note: "Hand-coded HTML and CSS, deployed somewhere free.", tag: "Code" },
  { year: "2024", title: "Started ACS at KMUTT", note: "Applied Computer Science: algorithms, architecture, programming language theory.", tag: "Study" },
  { year: "2025", title: "PirahusNext", note: "Minigames, shop and dashboards for the university's senior–junior \"code sibling\" event.", tag: "Project" },
  { year: "2026", title: "YafuuGallery shipped", note: "Multi-author reader with scroll and paged modes.", tag: "Project" },
  { year: "2026", title: "AWS Generative AI · KIRO Challenge", note: "Certificate of achievement from the AWS Generative AI Foundation Program.", tag: "Cert" },
  { year: "2026", title: "Portfolio Vol. 01", note: "You are here.", tag: "Now" },
];
