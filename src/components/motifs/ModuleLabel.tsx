import Shuffle from "../reactbits/Shuffle";

// Swiss module label ("01 — Selected work"); the words shuffle in (React Bits Shuffle)
// when the label scrolls into view, and again on hover.
export default function ModuleLabel({ n, text }: { n: string; text: string }) {
  return (
    <span className="module-label">
      <b>{n}</b>
      <span>
        —{" "}
        <Shuffle
          text={text}
          shuffleTimes={2}
          stagger={0.025}
          scrambleCharset="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>"
          colorFrom="#9a6bff"
          colorTo="#a7a3b3"
        />
      </span>
    </span>
  );
}
