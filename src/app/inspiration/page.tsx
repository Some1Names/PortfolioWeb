import type { Metadata } from "next";
import Inspiration from "@/components/inspiration/Inspiration";

export const metadata: Metadata = {
  title: "Inspiration — Uefa",
  description: "Films, anime and music Uefa keeps coming back to.",
};

// The /inspiration supplement: favourite films, anime and music (content: src/data/inspiration.ts)
export default function InspirationPage() {
  return (
    <main>
      <Inspiration />
    </main>
  );
}
