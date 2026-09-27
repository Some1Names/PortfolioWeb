import { site } from "@/data/site";
import styles from "./Motifs.module.css";

// Magazine page number for a spread: "Vol. 01 / P. 03"
export default function Folio({ page, className = "" }: { page: number; className?: string }) {
  return (
    <span className={`${styles.folio} ${className}`} aria-hidden="true">
      {site.volume} / P. {String(page).padStart(2, "0")}
    </span>
  );
}
