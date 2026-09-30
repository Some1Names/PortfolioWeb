import { branches, synergy } from "@/data/skills";
import { layoutSky, type Layout, type Sky } from "./constellation";

// The skies the star map draws, one per arrangement ("wide" on desktop, "tall" on phones): each laid
// out from the skills data the first time it's needed (a few dozen ms), then kept.
const skies: Partial<Record<Layout, Sky>> = {};
export const getSky = (layout: Layout = "wide") =>
  (skies[layout] ??= layoutSky(
    branches.map((b) => ({ title: b.name, skills: b.skills.map((s) => s.name), items: b.items.length })),
    11,
    synergy,
    layout,
  ));
