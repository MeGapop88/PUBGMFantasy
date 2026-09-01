/**
 * FORMATTERS — pure, used by both server and client components.
 * Ported from the Vite build's src/ui.js, minus the DOM helpers the framework
 * now owns (renderPage, showPageLoader, setActiveNav).
 */

export function fmt(n: number | null | undefined, decimals = 0): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Power Score with its unit, e.g. "1,204 PWR". */
export function fmtPower(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return `${Math.round(Number(n)).toLocaleString("en-US")} PWR`;
}

/** Power Score without the unit, for columns that carry their own header. */
export function fmtPowerNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Math.round(Number(n)).toLocaleString("en-US");
}

/** Seconds as m:ss. */
export function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ordinal(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Gold, silver, bronze, then accent for 4th–5th, then muted. */
export function placementColor(rank: number | null | undefined): string {
  if (rank === 1) return "#FFD700";
  if (rank === 2) return "#C0C0C0";
  if (rank === 3) return "#CD7F32";
  if (rank && rank <= 5) return "#FF6B00";
  return "#a98a7d";
}

export function getInitials(name: string): string {
  if (!name) return "?";
  return name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase();
}
