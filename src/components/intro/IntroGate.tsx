import Intro from "./Intro";

// Decides before the first paint whether the loading intro plays: on the home page, with no
// #hash, once per browser session, never for reduced motion. It only sets data-intro="play" on
// <html> (the overlay is hidden without it) and marks the session as seen, so a reload skips it.
const decide = `try{var d=document.documentElement;if(location.pathname==="/"&&!location.hash&&!sessionStorage.getItem("intro-seen")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){d.dataset.intro="play";sessionStorage.setItem("intro-seen","1")}}catch(e){}`;

export default function IntroGate() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: decide }} />
      <Intro />
    </>
  );
}
