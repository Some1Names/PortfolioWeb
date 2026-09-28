import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Inspiration from "@/components/inspiration/Inspiration";

export const metadata: Metadata = {
  title: "Inspiration — Uefa",
  description: "Films, anime and music Uefa keeps coming back to.",
};

// The /inspiration supplement: favourite films, anime and music (content: src/data/inspiration.ts)
export default function InspirationPage() {
  return (
    <>
      <Nav page="inspiration" />
      <main>
        <Inspiration />
      </main>
    </>
  );
}
