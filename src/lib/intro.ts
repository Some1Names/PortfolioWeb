// The loading intro's shared signal. IntroGate's inline script sets data-intro="play" on <html>
// before the first paint when the intro will run; finishIntro() flips it to "done" and tells
// whoever is waiting (the cover's entrance, the smooth scroll) to carry on.
export const INTRO_EVENT = "intro:done";
// the CSS failsafe reveals the page at 10s; JS that only arrives after this must not start it
export const INTRO_TOO_LATE_MS = 9500;

export function introPlaying(): boolean {
  return typeof document !== "undefined" && document.documentElement.dataset.intro === "play";
}

// runs cb now when no intro is playing, otherwise once it hands over; returns an unsubscribe
export function onIntroDone(cb: () => void): () => void {
  if (!introPlaying()) {
    cb();
    return () => {};
  }
  const handler = () => cb();
  window.addEventListener(INTRO_EVENT, handler, { once: true });
  return () => window.removeEventListener(INTRO_EVENT, handler);
}

export function finishIntro(): void {
  if (!introPlaying()) return;
  document.documentElement.dataset.intro = "done";
  window.dispatchEvent(new Event(INTRO_EVENT));
}

export const introTooLate = (nowMs: number) => nowMs > INTRO_TOO_LATE_MS;
