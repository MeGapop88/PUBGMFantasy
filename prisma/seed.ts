/**
 * SEED — rebuilds the tournament from the Shadow Tracker files in public/data.
 *
 * DESTRUCTIVE: clears every tournament and user table before writing. Do not
 * run this against a database holding real data.
 *
 * The 36 match files stay in the repo as the seed's source. Swapping in real
 * exports means changing what this script reads, not the schema.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { matchPower, placementPoints, predictionPayout } from "../lib/scoring";
import { slugify, teamBrand } from "../lib/teams";

const prisma = new PrismaClient();
const DATA_DIR = join(process.cwd(), "public", "data");

// League runs before Finals. Sorting these strings alphabetically puts Finals
// first, which is exactly the chronology bug this schema's `order` column exists
// to make impossible.
const PHASE_ORDER = ["League", "Finals"] as const;
const DAYS = [1, 2, 3];
const GAMES = [1, 2, 3, 4, 5, 6];

const DEMO_PASSWORD = "tactical123";
const DEMO_CALLSIGNS = [
  "Recon-01",
  "Overwatch",
  "Dropshot",
  "Kill-Feed",
  "Zone-Caller",
  "Blue-Line",
  "Third-Party",
  "Prone-Andy",
  "Loot-Goblin",
  "Bot-Lobby",
];

type RawPlayer = {
  uId: number | string;
  playerName: string;
  playerOpenId?: string;
  teamId: number;
  teamName: string;
  rank: number;
  killNum: number;
  damage: number;
  heal: number;
  survivalTime: number;
  knockouts: number;
  assists: number;
  headShotNum: number;
  maxKillDistance: number;
  driveDistance: number;
  marchDistance: number;
};

/** recon@pmgo.local from "Recon-01" — one address per demo callsign. */
function demoEmail(callsign: string): string {
  return `${callsign.toLowerCase().replace(/[^a-z0-9]/g, "")}@pmgo.local`;
}

/** Deterministic RNG, so reseeding produces the same demo squads and picks. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function readMatchFile(phase: string, day: number, game: number): RawPlayer[] | null {
  try {
    const raw = readFileSync(join(DATA_DIR, `${phase} D${day} G${game}.json`), "utf-8");
    return JSON.parse(raw)[0]?.allinfo?.TotalPlayerList ?? null;
  } catch {
    return null; // not played yet — a legitimate state, not an error
  }
}

async function main() {
  console.log("Clearing tournament tables…");
  // Child rows first: most cascade, but being explicit keeps this correct if a
  // relation ever loses its onDelete.
  await prisma.squadPick.deleteMany();
  await prisma.squad.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.teamResult.deleteMany();
  await prisma.playerStat.deleteMany();
  await prisma.match.deleteMany();
  await prisma.scheduleDay.deleteMany();
  await prisma.player.deleteMany();
  await prisma.team.deleteMany();

  // ------------------------------------------------------------ roster
  // Branding and artwork, produced by scripts/fetch-assets.mjs. Optional: the
  // seed still runs without it, teams just fall back to derived initials and
  // players to no photo.
  type Assets = {
    teams: Record<string, { slug: string; tag: string; color: string; logo: string | null; flag: string | null }>;
    players: Record<string, string | null>;
  };
  let assets: Assets = { teams: {}, players: {} };
  try {
    assets = JSON.parse(readFileSync(join(DATA_DIR, "assets.json"), "utf-8"));
    console.log(`  assets manifest: ${Object.keys(assets.teams).length} teams, ${Object.values(assets.players).filter(Boolean).length} photos`);
  } catch {
    console.log("  no assets.json — run `node scripts/fetch-assets.mjs` for logos and photos");
  }

  const roster = JSON.parse(readFileSync(join(DATA_DIR, "roster.json"), "utf-8")) as {
    teams: { teamId: number; teamName: string }[];
    players: { uId: string; playerName: string; teamId: number; teamName: string }[];
  };

  await prisma.team.createMany({
    data: roster.teams.map((t) => {
      const a = assets.teams[t.teamName];
      const brand = teamBrand(t.teamName);
      return {
        id: t.teamId,
        name: t.teamName,
        slug: a?.slug ?? brand.slug ?? slugify(t.teamName),
        color: a?.color ?? brand.color,
        initials: a?.tag ?? brand.initials,
        logo: a?.logo ?? null,
        flag: a?.flag ?? null,
      };
    }),
  });
  console.log(`  ${roster.teams.length} teams`);

  await prisma.player.createMany({
    data: roster.players.map((p) => ({
      uid: String(p.uId),
      name: p.playerName,
      teamId: p.teamId,
      photo: assets.players[p.playerName] ?? null,
    })),
  });
  console.log(`  ${roster.players.length} players`);

  // ---------------------------------------------------- schedule + matches
  //
  // Windows are anchored to seed time so the app has all three day states to
  // show: the first two days are locked and resolved, the third is open for
  // picks, and the Finals days are still upcoming. They live in the database
  // from here on, so moving a deadline is an UPDATE, not a rebuild.
  const HOUR = 60 * 60 * 1000;
  const now = Date.now();
  const OPEN_DAY_INDEX = 2;

  let order = 0;
  const matchRows: {
    id: string;
    key: string;
    phase: string;
    day: number;
    game: number;
    order: number;
    hasResults: boolean;
    scheduleDayId: string;
  }[] = [];
  const statRows: Prisma.PlayerStatCreateManyInput[] = [];
  const resultRows: Prisma.TeamResultCreateManyInput[] = [];

  let dayIndex = 0;
  for (const phase of PHASE_ORDER) {
    for (const day of DAYS) {
      // Offset in days from the open one: -2 and -1 are past, 0 is now, +1…
      const offset = dayIndex - OPEN_DAY_INDEX;
      const opensAt = new Date(now + offset * 24 * HOUR - HOUR);
      const locksAt = new Date(now + offset * 24 * HOUR + 3 * HOUR);

      const scheduleDay = await prisma.scheduleDay.create({
        data: { phase, day, label: `${phase} — Day ${day}`, opensAt, locksAt },
      });

      for (const game of GAMES) {
        const players = readMatchFile(phase, day, game);
        const match = await prisma.match.create({
          data: {
            key: `${phase}_D${day}_G${game}`,
            phase,
            day,
            game,
            order: order++,
            hasResults: players !== null && players.length > 0,
            scheduleDayId: scheduleDay.id,
          },
        });
        matchRows.push({ ...match });

        if (!players) continue;

        // Per-team totals for the denormalised TeamResult table.
        const byTeam = new Map<number, { rank: number; kills: number; damage: number }>();

        for (const p of players) {
          statRows.push({
            matchId: match.id,
            playerUid: String(p.uId),
            rank: p.rank ?? 16,
            killNum: p.killNum ?? 0,
            damage: p.damage ?? 0,
            heal: p.heal ?? 0,
            survivalTime: p.survivalTime ?? 0,
            knockouts: p.knockouts ?? 0,
            assists: p.assists ?? 0,
            headShotNum: p.headShotNum ?? 0,
            maxKillDistance: p.maxKillDistance ?? 0,
            driveDistance: p.driveDistance ?? 0,
            marchDistance: p.marchDistance ?? 0,
            power: matchPower({
              killNum: p.killNum ?? 0,
              knockouts: p.knockouts ?? 0,
              damage: p.damage ?? 0,
              survivalTime: p.survivalTime ?? 0,
            }),
          });

          const t = byTeam.get(p.teamId) ?? { rank: p.rank ?? 16, kills: 0, damage: 0 };
          t.kills += p.killNum ?? 0;
          t.damage += p.damage ?? 0;
          byTeam.set(p.teamId, t);
        }

        for (const [teamId, t] of byTeam) {
          const place = placementPoints(t.rank);
          resultRows.push({
            matchId: match.id,
            teamId,
            rank: t.rank,
            kills: t.kills,
            damage: t.damage,
            placementPoints: place,
            totalPoints: place + t.kills,
          });
        }
      }
      dayIndex++;
    }
  }

  console.log(`  ${matchRows.length} matches across ${dayIndex} schedule days`);

  // createMany in chunks — 2304 stat rows in one statement exceeds Postgres's
  // bind-parameter limit.
  const CHUNK = 500;
  for (let i = 0; i < statRows.length; i += CHUNK) {
    await prisma.playerStat.createMany({ data: statRows.slice(i, i + CHUNK) });
  }
  console.log(`  ${statRows.length} player stat rows`);

  for (let i = 0; i < resultRows.length; i += CHUNK) {
    await prisma.teamResult.createMany({ data: resultRows.slice(i, i + CHUNK) });
  }
  console.log(`  ${resultRows.length} team result rows`);

  // ------------------------------------------------------------- demo users
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const rand = mulberry32(20260831);

  const allPlayers = roster.players.map((p) => ({ uid: String(p.uId), teamId: p.teamId }));
  const resolvedMatches = matchRows.filter(
    (m) => m.hasResults && PHASE_ORDER.indexOf(m.phase as "League") * 3 + m.day - 1 < OPEN_DAY_INDEX,
  );
  const resultByMatch = new Map<string, typeof resultRows>();
  for (const r of resultRows) {
    const list = resultByMatch.get(r.matchId) ?? [];
    list.push(r);
    resultByMatch.set(r.matchId, list);
  }

  for (const callsign of DEMO_CALLSIGNS) {
    const user = await prisma.user.create({
      data: { name: callsign, email: demoEmail(callsign), passwordHash },
    });

    // A legal squad: draft at random, honouring the 2-per-team cap.
    const picks: { uid: string; teamId: number }[] = [];
    const perTeam = new Map<number, number>();
    while (picks.length < 4) {
      const cand = allPlayers[Math.floor(rand() * allPlayers.length)];
      if (picks.some((p) => p.uid === cand.uid)) continue;
      if ((perTeam.get(cand.teamId) ?? 0) >= 2) continue;
      perTeam.set(cand.teamId, (perTeam.get(cand.teamId) ?? 0) + 1);
      picks.push(cand);
    }

    await prisma.squad.create({
      data: {
        userId: user.id,
        name: `${callsign} SQUAD`,
        picks: {
          create: picks.map((p, i) => ({ playerUid: p.uid, slot: i + 1 })),
        },
      },
    });

    // Picks on the already-resolved days, scored against what actually happened.
    for (const match of resolvedMatches) {
      const results = resultByMatch.get(match.id) ?? [];
      if (results.length === 0) continue;
      const pick = results[Math.floor(rand() * results.length)];
      await prisma.prediction.create({
        data: {
          userId: user.id,
          matchId: match.id,
          teamId: pick.teamId,
          pointsAwarded: predictionPayout(pick.rank),
        },
      });
    }
  }
  console.log(`  ${DEMO_CALLSIGNS.length} demo users, each with a squad and picks`);
  console.log(`\nSign in as ${demoEmail(DEMO_CALLSIGNS[0])} / ${DEMO_PASSWORD}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
