import styles from "./Hud.module.css";

// A HUD panel with two cut (angled) corners and a 1px edge that follows the cut: the panel is
// clipped to the shape, its background shows as the edge, and ::before fills the inside.
export default function CutPanel({
  as: Comp = "div",
  corners = "tl-br",
  notch = 14,
  className = "",
  style,
  children,
  ...rest
}: {
  as?: React.ElementType;
  corners?: "tl-br" | "tr-bl";
  notch?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
} & Record<string, unknown>) {
  return (
    <Comp
      className={`${styles.cut} ${corners === "tr-bl" ? styles.cutAlt : ""} ${className}`}
      style={{ ...style, "--notch": `${notch}px` } as React.CSSProperties}
      {...rest}
    >
      {children}
    </Comp>
  );
}
