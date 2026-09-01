/**
 * Downloads team and player artwork from the PMGO stats repo and writes a local
 * manifest the seed reads.
 *
 *   node scripts/fetch-assets.mjs
 *
 * Source: github.com/Capex11/PUBG-stats-website — the same tournament, keyed by
 * the exact team and player names that appear in the Shadow Tracker telemetry,
 * so nothing here has to be matched up by hand.
 *
 * Writes:
 *   public/logos/<slug>-logo.webp     16 official marks, transparent
 *   public/flags/<slug>-flag.webp     16 flags
 *   public/players/<slug>-photo.webp  77 cutout headshots
 *   public/data/assets.json           name -> local path, colour and tag
 *
 * Re-run it to refresh. Images already present are skipped unless --force.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REPO = "https://raw.githubusercontent.com/Capex11/PUBG-stats-website/main";
const FORCE = process.argv.includes("--force");

/**
 * Three teams come back as #8b93a7 — that is their extractor's neutral
 * fallback, not a brand colour, so the existing values are kept for those.
 */
const GREY_FALLBACK = "#8b93a7";
const KEEP_OUR_COLOR = {
  "DAT ALREMAL": "#FF9900",
  "ETSH ESPORTS": "#00FF66",
  "FOUR WIZ": "#9933FF",
};

const out = (...p) => join(process.cwd(), "public", ...p);
for (const dir of ["logos", "flags", "players", "data"]) {
  mkdirSync(out(dir), { recursive: true });
}

async function grab(remote, local) {
  if (!FORCE && existsSync(local)) return "skip";
  const res = await fetch(`${REPO}/${remote}`);
  if (!res.ok) return `HTTP ${res.status}`;
  writeFileSync(local, Buffer.from(await res.arrayBuffer()));
  return "ok";
}

const src = await (await fetch(`${REPO}/data/assets.json`)).json();
const tally = { ok: 0, skip: 0, fail: 0 };
const note = (r) => {
  if (r === "ok") tally.ok++;
  else if (r === "skip") tally.skip++;
  else tally.fail++;
  return r;
};

// ------------------------------------------------------------------- teams
const teams = {};
for (const [name, t] of Object.entries(src.teams)) {
  const logo = `${t.slug}-logo.webp`;
  const flag = `${t.slug}-flag.webp`;
  const gotLogo = note(await grab(`assets/img/teams/${logo}`, out("logos", logo)));
  const gotFlag = note(await grab(`assets/img/teams/${flag}`, out("flags", flag)));

  teams[name] = {
    slug: t.slug,
    tag: t.tag,
    color:
      t.color?.toLowerCase() === GREY_FALLBACK ? (KEEP_OUR_COLOR[name] ?? t.color) : t.color,
    logo: gotLogo === "fail" ? null : `/logos/${logo}`,
    flag: gotFlag === "fail" ? null : `/flags/${flag}`,
  };
  if (gotLogo !== "skip" || gotFlag !== "skip") {
    console.log(`  team   ${name.padEnd(16)} logo=${gotLogo} flag=${gotFlag}`);
  }
}

// ----------------------------------------------------------------- players
const players = {};
let missing = 0;
for (const [name, p] of Object.entries(src.players)) {
  const file = `${p.slug}-photo.webp`;
  const got = note(await grab(`assets/img/players/${file}`, out("players", file)));
  // Two names carry macrons their exporter could not resolve; those players
  // keep the initials fallback rather than a broken image.
  if (got !== "ok" && got !== "skip") {
    players[name] = null;
    missing++;
    console.log(`  player ${name.padEnd(20)} NO PHOTO (${got})`);
  } else {
    players[name] = `/players/${file}`;
  }
}

writeFileSync(
  out("data", "assets.json"),
  JSON.stringify({ source: "github.com/Capex11/PUBG-stats-website", teams, players }, null, 2),
);

console.log(
  `\n${Object.keys(teams).length} teams, ${Object.keys(players).length} players ` +
    `(${missing} without a photo)\ndownloaded ${tally.ok}, skipped ${tally.skip}, failed ${tally.fail}`,
);
