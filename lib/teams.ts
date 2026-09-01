/**
 * TEAM BRANDING REGISTRY — the 16 PMGO teams.
 *
 * Telemetry carries a team's id and name but no branding, so colour, initials
 * and badge live here. The seed copies these onto Team rows; at runtime the app
 * reads the database, not this file.
 *
 * Logos were served from googleusercontent URLs with no uptime guarantee and
 * are now local under public/logos/.
 */

export type TeamBrand = {
  slug: string;
  color: string;
  initials: string;
  logo: string;
};

/** Keyed by the exact `teamName` string that appears in Shadow Tracker JSON. */
export const TEAM_BRANDS: Record<string, TeamBrand> = {
  "721 ESPORTS": { slug: "721-esports", color: "#FF6B00", initials: "721", logo: "/logos/721-esports.jpg" },
  "7C ESPORTS": { slug: "7c-esports", color: "#00E5FF", initials: "7C", logo: "/logos/7c-esports.jpg" },
  "ALULA Esports": { slug: "alula-esports", color: "#FFD700", initials: "ALU", logo: "/logos/alula-esports.jpg" },
  "CB9 Esports": { slug: "cb9-esports", color: "#FF3366", initials: "CB9", logo: "/logos/cb9-esports.jpg" },
  "DAT ALREMAL": { slug: "dat-alremal", color: "#FF9900", initials: "DAT", logo: "/logos/dat-alremal.jpg" },
  "ETSH ESPORTS": { slug: "etsh-esports", color: "#00FF66", initials: "ETS", logo: "/logos/etsh-esports.jpg" },
  "FOUR WIZ": { slug: "four-wiz", color: "#9933FF", initials: "4WZ", logo: "/logos/four-wiz.jpg" },
  "Geekay Esports": { slug: "geekay-esports", color: "#00CCFF", initials: "GK", logo: "/logos/geekay-esports.jpg" },
  "KHK Esports": { slug: "khk-esports", color: "#FF6600", initials: "KHK", logo: "/logos/khk-esports.jpg" },
  "MASTER TEAM": { slug: "master-team", color: "#FFCC00", initials: "MST", logo: "/logos/master-team.jpg" },
  "Nigma Galaxy": { slug: "nigma-galaxy", color: "#8A2BE2", initials: "NGX", logo: "/logos/nigma-galaxy.jpg" },
  "R8 ESPORTS": { slug: "r8-esports", color: "#FF0055", initials: "R8", logo: "/logos/r8-esports.jpg" },
  "RA'AD": { slug: "ra-ad", color: "#00FFFF", initials: "RAD", logo: "/logos/ra-ad.jpg" },
  "THE HUNTERS": { slug: "the-hunters", color: "#FF6B00", initials: "HUN", logo: "/logos/the-hunters.jpg" },
  "Team Vision": { slug: "team-vision", color: "#00FFCC", initials: "VIS", logo: "/logos/team-vision.jpg" },
  "iKURD ESPORTS": { slug: "ikurd-esports", color: "#FF0033", initials: "KRD", logo: "/logos/ikurd-esports.jpg" },
};

/** Slug a name the same way the logo filenames were generated. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Branding for a team name, case-insensitively, with a generated fallback so an
 * unregistered team still renders a badge rather than a hole.
 */
export function teamBrand(name: string): TeamBrand {
  const exact = TEAM_BRANDS[name?.trim()];
  if (exact) return exact;

  const key = Object.keys(TEAM_BRANDS).find(
    (k) => k.toLowerCase() === name?.trim().toLowerCase(),
  );
  if (key) return TEAM_BRANDS[key];

  return {
    slug: slugify(name ?? "unknown"),
    color: "#FF6B00",
    initials: (name ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase() || "TM",
    logo: "",
  };
}
