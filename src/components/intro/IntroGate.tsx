import Intro from "./Intro";

// Decides before the first paint whether the loading intro plays: on the home page, with no
// #hash, never for reduced motion; on the first visit of a browser session, and again on every
// reload. Other arrivals in the session (links back home, the Back button) skip it. It only sets
// data-intro="play" on <html> (the overlay is hidden without it) and marks the session as seen.
const decide = `try{var d=document.documentElement,n=performance.getEntriesByType&&performance.getEntriesByType("navigation")[0],reload=!!n&&n.type==="reload";if(location.pathname==="/"&&!location.hash&&(reload||!sessionStorage.getItem("intro-seen"))&&!matchMedia("(prefers-reduced-motion: reduce)").matches){d.dataset.intro="play";sessionStorage.setItem("intro-seen","1")}}catch(e){}`;

export default function IntroGate() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: decide }} />
      <Intro />
    </>
  );
}
