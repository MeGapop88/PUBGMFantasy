/**
 * Derives public/data/roster.json from the match files in public/data.
 *
 * The roster is the canonical list of every team and player, independent of
 * matches played — it is what lets teams and players appear (with all-zero
 * stats) before a tournament starts. `prisma/seed.ts` reads it.
 *
 * Re-run this after adding or replacing match telemetry:
 *   node scripts/build-roster.mjs
 *
 * It used to emit schedule.json too. Pick deadlines now live in the
 * ScheduleDay table, seeded by prisma/seed.ts — a generated file baked
 * Date.now()-relative timestamps in at build time and silently expired,
 * locking predictions forever once its last day passed.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dataDir = join(process.cwd(), "public", "data");
const files = readdirSync(dataDir).filter(
  (f) => f.endsWith(".json") && f !== "roster.json" && f !== "schedule.json",
);

const teams = new Map(); // teamId -> { teamId, teamName }
const players = new Map(); // uId -> { uId, playerName, teamId, teamName }

for (const filename of files) {
  const raw = JSON.parse(readFileSync(join(dataDir, filename), "utf-8"));
  for (const p of raw[0]?.allinfo?.TotalPlayerList ?? []) {
    if (!teams.has(p.teamId)) teams.set(p.teamId, { teamId: p.teamId, teamName: p.teamName });

    const uId = String(p.uId);
    if (!players.has(uId)) {
      players.set(uId, {
        uId,
        playerName: p.playerName,
        teamId: p.teamId,
        teamName: p.teamName,
        photoId: null,
        role: null,
      });
    }
  }
}

const roster = {
  teams: [...teams.values()]
    .sort((a, b) => a.teamName.localeCompare(b.teamName))
    .map((t) => ({
      teamId: t.teamId,
      teamName: t.teamName,
      shortCode: t.teamName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase(),
      logoId: null,
    })),
  players: [...players.values()].sort((a, b) => a.playerName.localeCompare(b.playerName)),
};

writeFileSync(join(dataDir, "roster.json"), JSON.stringify(roster, null, 2));
console.log(
  `roster.json: ${roster.teams.length} teams, ${roster.players.length} players from ${files.length} match files`,
);
