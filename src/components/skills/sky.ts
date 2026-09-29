import { branches, synergy } from "@/data/skills";
import { layoutSky, type Sky } from "./constellation";

// The one sky the star map and the phones' mini sky both draw: laid out from the skills data the
// first time either needs it (the layout takes a few dozen ms), then kept.
let sky: Sky | null = null;
export const getSky = () =>
  (sky ??= layoutSky(
    branches.map((b) => ({ title: b.name, skills: b.skills.map((s) => s.name), items: b.items.length })),
    11,
    synergy,
  ));
