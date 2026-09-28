import Nav from "@/components/Nav";
import IntroGate from "@/components/intro/IntroGate";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Work from "@/components/Work";
import About from "@/components/About";
import Timeline from "@/components/Timeline";
import SkillTree from "@/components/SkillTree";
import Contact from "@/components/Contact";
import { projectParties } from "@/lib/github";

// Every section is a spread: an art page and a web page joined by a seam.
export default async function Home() {
  const parties = await projectParties();
  return (
    <>
      <IntroGate />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Work parties={parties} />
        <About />
        <Timeline />
        <SkillTree />
        <Contact />
      </main>
    </>
  );
}
