import "server-only";

import { prisma } from "./db";
import { playerTrend, type Trend } from "./scoring";

/**
 * SERVER READS.
 *
 * Every read that cares about chronology orders by `Match.order`. The Vite
 * build sorted by `phase` alphabetically, which puts "Finals" before "League"
 * and silently reversed each player's match history — form trends were computed
 * against the wrong game.
 */

// ------------------------------------------------------------------- types

export type PlayerAggregate = {
  uid: string;
  name: string;
  teamId: number;
  teamName: string;
  teamColor: string;
  teamInitials: string;
  teamLogo: string | null;
  photo: string | null;
  matchesPlayed: number;
  totalPower: number;
  avgPower: number;
  totalEliminations: number;
  avgEliminations: number;
  totalDamage: number;
  avgDamage: number;
  totalKnockdowns: number;
  totalHeadShots: number;
  totalAssists: number;
  totalSurvivalTime: number;
  avgSurvival: number;
  /** Kills per match. The app has always labelled this "K/D". */
  kd: number;
  trend: Trend | null;
};

export type PlayerMatchRow = {
  matchKey: string;
  phase: string;
  day: number;
  game: number;
  order: number;
  rank: number;
  eliminations: number;
  damage: number;
  knockdowns: number;
  survivalTime: number;
  headShots: number;
  assists: number;
  power: number;
};

export type TeamAggregate = {
  teamId: number;
  teamName: string;
  color: string;
  initials: string;
  logo: string | null;
  flag: string | null;
  slug: string;
  matchesPlayed: number;
  wins: number;
  top3: number;
  totalKills: number;
  totalDamage: number;
  totalPlacePts: number;
  totalPoints: number;
  avgKills: number;
  avgPlacement: number;
};

export type StandingsRow = TeamAggregate & { tournamentRank: number };

// --------------------------------------------------------------- aggregates

/**
 * Per-player career aggregate, pre-seeded from the roster so a player who has
 * not played yet still appears with every stat at 0 rather than not existing.
 *
 * One findMany over 2304 stat rows and a reduce beats a fan-out of groupBy
 * queries at this size, and keeps the trend calculation on ordered data.
 */
export async function getPlayerAggregates(): Promise<PlayerAggregate[]> {
  const [players, stats] = await Promise.all([
    prisma.player.findMany({ include: { team: true }, orderBy: { name: "asc" } }),
    prisma.playerStat.findMany({
      select: {
        playerUid: true,
        killNum: true,
        damage: true,
        knockouts: true,
        survivalTime: true,
        headShotNum: true,
        assists: true,
        power: true,
      },
      orderBy: { match: { order: "asc" } },
    }),
  ]);

  const powersByPlayer = new Map<string, number[]>();
  const totals = new Map<
    string,
    { p: number; k: number; d: number; ko: number; hs: number; a: number; st: number; n: number }
  >();

  for (const s of stats) {
    const t = totals.get(s.playerUid) ?? { p: 0, k: 0, d: 0, ko: 0, hs: 0, a: 0, st: 0, n: 0 };
    t.p += s.power;
    t.k += s.killNum;
    t.d += s.damage;
    t.ko += s.knockouts;
    t.hs += s.headShotNum;
    t.a += s.assists;
    t.st += s.survivalTime;
    t.n += 1;
    totals.set(s.playerUid, t);

    const powers = powersByPlayer.get(s.playerUid) ?? [];
    powers.push(s.power);
    powersByPlayer.set(s.playerUid, powers);
  }

  return players.map((p) => {
    const t = totals.get(p.uid) ?? { p: 0, k: 0, d: 0, ko: 0, hs: 0, a: 0, st: 0, n: 0 };
    const n = t.n || 1;
    return {
      uid: p.uid,
      name: p.name,
      teamId: p.teamId,
      teamName: p.team.name,
      teamColor: p.team.color,
      teamInitials: p.team.initials,
      teamLogo: p.team.logo,
      photo: p.photo,
      matchesPlayed: t.n,
      totalPower: Math.round(t.p * 10) / 10,
      avgPower: t.n ? Math.round((t.p / n) * 10) / 10 : 0,
      totalEliminations: t.k,
      avgEliminations: t.n ? t.k / n : 0,
      totalDamage: t.d,
      avgDamage: t.n ? t.d / n : 0,
      totalKnockdowns: t.ko,
      totalHeadShots: t.hs,
      totalAssists: t.a,
      totalSurvivalTime: t.st,
      avgSurvival: t.n ? t.st / n : 0,
      kd: t.n ? t.k / n : 0,
      trend: playerTrend(powersByPlayer.get(p.uid) ?? []),
    };
  });
}

/** One player's dossier plus their full match log, in tournament order. */
export async function getPlayerDossier(uid: string) {
  const player = await prisma.player.findUnique({
    where: { uid },
    include: { team: true },
  });
  if (!player) return null;

  const stats = await prisma.playerStat.findMany({
    where: { playerUid: uid },
    include: { match: true },
    orderBy: { match: { order: "asc" } },
  });

  const matches: PlayerMatchRow[] = stats.map((s) => ({
    matchKey: s.match.key,
    phase: s.match.phase,
    day: s.match.day,
    game: s.match.game,
    order: s.match.order,
    rank: s.rank,
    eliminations: s.killNum,
    damage: s.damage,
    knockdowns: s.knockouts,
    survivalTime: s.survivalTime,
    headShots: s.headShotNum,
    assists: s.assists,
    power: s.power,
  }));

  const n = matches.length || 1;
  const sum = (pick: (m: PlayerMatchRow) => number) =>
    matches.reduce((s, m) => s + pick(m), 0);

  return {
    uid: player.uid,
    name: player.name,
    teamId: player.teamId,
    teamName: player.team.name,
    teamColor: player.team.color,
    teamInitials: player.team.initials,
    teamLogo: player.team.logo,
    photo: player.photo,
    matchesPlayed: matches.length,
    avgPower: matches.length ? Math.round((sum((m) => m.power) / n) * 10) / 10 : 0,
    avgEliminations: matches.length ? sum((m) => m.eliminations) / n : 0,
    avgDamage: matches.length ? sum((m) => m.damage) / n : 0,
    avgSurvival: matches.length ? sum((m) => m.survivalTime) / n : 0,
    bestPower: matches.length ? Math.max(...matches.map((m) => m.power)) : 0,
    bestKills: matches.length ? Math.max(...matches.map((m) => m.eliminations)) : 0,
    bestDamage: matches.length ? Math.max(...matches.map((m) => m.damage)) : 0,
    trend: playerTrend(matches.map((m) => m.power)),
    matches,
  };
}

/**
 * Per-team aggregate, roster-seeded so every team has a row (all zeros) even
 * before playing a match.
 */
export async function getTeamAggregates(): Promise<TeamAggregate[]> {
  const [teams, results] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.teamResult.findMany({
      select: { teamId: true, rank: true, kills: true, damage: true, placementPoints: true, totalPoints: true },
    }),
  ]);

  const acc = new Map<
    number,
    { n: number; wins: number; top3: number; kills: number; dmg: number; place: number; pts: number; ranks: number[] }
  >();

  for (const r of results) {
    const a =
      acc.get(r.teamId) ?? { n: 0, wins: 0, top3: 0, kills: 0, dmg: 0, place: 0, pts: 0, ranks: [] };
    a.n += 1;
    a.kills += r.kills;
    a.dmg += r.damage;
    a.place += r.placementPoints;
    a.pts += r.totalPoints;
    a.ranks.push(r.rank);
    if (r.rank === 1) a.wins += 1;
    if (r.rank <= 3) a.top3 += 1;
    acc.set(r.teamId, a);
  }

  return teams.map((t) => {
    const a =
      acc.get(t.id) ?? { n: 0, wins: 0, top3: 0, kills: 0, dmg: 0, place: 0, pts: 0, ranks: [] };
    const n = a.n || 1;
    return {
      teamId: t.id,
      teamName: t.name,
      color: t.color,
      initials: t.initials,
      logo: t.logo,
      flag: t.flag,
      slug: t.slug,
      matchesPlayed: a.n,
      wins: a.wins,
      top3: a.top3,
      totalKills: a.kills,
      totalDamage: a.dmg,
      totalPlacePts: a.place,
      totalPoints: a.pts,
      avgKills: a.kills / n,
      avgPlacement: a.ranks.length ? a.ranks.reduce((s, r) => s + r, 0) / a.ranks.length : 0,
    };
  });
}

/**
 * Overall standings across the Finals phase, falling back to every played match
 * while the Finals have not started.
 */
export async function getFinalsStandings(): Promise<StandingsRow[]> {
  const [teams, finalsResults, allResults] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.teamResult.findMany({ where: { match: { phase: "Finals", hasResults: true } } }),
    prisma.teamResult.findMany({ where: { match: { hasResults: true } } }),
  ]);

  const results = finalsResults.length > 0 ? finalsResults : allResults;

  const acc = new Map<
    number,
    { n: number; wins: number; top3: number; kills: number; dmg: number; place: number; pts: number; ranks: number[] }
  >();
  for (const r of results) {
    const a =
      acc.get(r.teamId) ?? { n: 0, wins: 0, top3: 0, kills: 0, dmg: 0, place: 0, pts: 0, ranks: [] };
    a.n += 1;
    a.kills += r.kills;
    a.dmg += r.damage;
    a.place += r.placementPoints;
    a.pts += r.totalPoints;
    a.ranks.push(r.rank);
    if (r.rank === 1) a.wins += 1;
    if (r.rank <= 3) a.top3 += 1;
    acc.set(r.teamId, a);
  }

  const rows = teams.map((t) => {
    const a =
      acc.get(t.id) ?? { n: 0, wins: 0, top3: 0, kills: 0, dmg: 0, place: 0, pts: 0, ranks: [] };
    const n = a.n || 1;
    return {
      teamId: t.id,
      teamName: t.name,
      color: t.color,
      initials: t.initials,
      logo: t.logo,
      flag: t.flag,
      slug: t.slug,
      matchesPlayed: a.n,
      wins: a.wins,
      top3: a.top3,
      totalKills: a.kills,
      totalDamage: a.dmg,
      totalPlacePts: a.place,
      totalPoints: a.pts,
      avgKills: a.kills / n,
      avgPlacement: a.ranks.length ? a.ranks.reduce((s, r) => s + r, 0) / a.ranks.length : 0,
    };
  });

  // Points, then WWCDs, then kills, then least damage taken to get there.
  rows.sort(
    (a, b) =>
      b.totalPoints - a.totalPoints ||
      b.wins - a.wins ||
      b.totalKills - a.totalKills ||
      a.totalDamage - b.totalDamage ||
      a.teamName.localeCompare(b.teamName),
  );

  return rows.map((r, i) => ({ ...r, tournamentRank: i + 1 }));
}

// ------------------------------------------------------------------ matches

/** Every match with its headline numbers, in tournament order. */
export async function getMatchSummaries() {
  const matches = await prisma.match.findMany({
    orderBy: { order: "asc" },
    include: {
      results: { include: { team: true }, orderBy: { rank: "asc" } },
    },
  });

  const topKillers = await prisma.playerStat.groupBy({
    by: ["matchId"],
    _max: { killNum: true },
    _sum: { killNum: true },
  });
  const topByMatch = new Map(topKillers.map((t) => [t.matchId, t]));

  return matches.map((m) => {
    const agg = topByMatch.get(m.id);
    return {
      id: m.id,
      key: m.key,
      phase: m.phase,
      day: m.day,
      game: m.game,
      order: m.order,
      hasResults: m.hasResults,
      teamCount: m.results.length,
      totalKills: agg?._sum.killNum ?? 0,
      topFrags: agg?._max.killNum ?? 0,
      winner: m.results.find((r) => r.rank === 1)?.team ?? null,
    };
  });
}

/** Full detail for one match, addressed by its URL key ("Finals_D2_G3"). */
export async function getMatchDetail(key: string) {
  const match = await prisma.match.findUnique({
    where: { key },
    include: {
      scheduleDay: true,
      results: { include: { team: true }, orderBy: { rank: "asc" } },
      stats: { include: { player: true } },
    },
  });
  if (!match) return null;

  const byTeam = new Map<number, typeof match.stats>();
  for (const s of match.stats) {
    const list = byTeam.get(s.player.teamId) ?? [];
    list.push(s);
    byTeam.set(s.player.teamId, list);
  }

  const teams = match.results.map((r) => ({
    teamId: r.teamId,
    teamName: r.team.name,
    color: r.team.color,
    initials: r.team.initials,
    logo: r.team.logo,
    rank: r.rank,
    kills: r.kills,
    damage: r.damage,
    placePts: r.placementPoints,
    totalMatchPts: r.totalPoints,
    players: (byTeam.get(r.teamId) ?? [])
      .map((s) => ({
        uid: s.playerUid,
        name: s.player.name,
        eliminations: s.killNum,
        knockdowns: s.knockouts,
        damage: s.damage,
        survivalTime: s.survivalTime,
        headShots: s.headShotNum,
        power: s.power,
      }))
      .sort((a, b) => b.power - a.power),
  }));

  const topKiller = [...match.stats].sort((a, b) => b.killNum - a.killNum)[0];

  return {
    id: match.id,
    key: match.key,
    phase: match.phase,
    day: match.day,
    game: match.game,
    hasResults: match.hasResults,
    scheduleDay: match.scheduleDay,
    teams,
    totalKills: match.stats.reduce((s, x) => s + x.killNum, 0),
    winner: teams.find((t) => t.rank === 1) ?? null,
    topKiller: topKiller
      ? { name: topKiller.player.name, eliminations: topKiller.killNum }
      : null,
  };
}

// ----------------------------------------------------------------- schedule

/** Tournament days with their pick windows and the matches inside each. */
export async function getSchedule() {
  const days = await prisma.scheduleDay.findMany({
    orderBy: { opensAt: "asc" },
    include: {
      matches: {
        orderBy: { order: "asc" },
        include: { results: { include: { team: true }, orderBy: { rank: "asc" } } },
      },
    },
  });
  return days;
}

// -------------------------------------------------------------- user state

export async function getUserPredictions(userId: string) {
  return prisma.prediction.findMany({
    where: { userId },
    include: { team: true, match: true },
  });
}

export async function getUserSquad(userId: string) {
  return prisma.squad.findUnique({
    where: { userId },
    include: { picks: { orderBy: { slot: "asc" } } },
  });
}

// ------------------------------------------------------------ leaderboards

/**
 * Fantasy standings: every saved squad, scored on the summed average Power
 * Score of its four operatives.
 *
 * These are real cross-user standings. The Vite build read them out of
 * localStorage, so every visitor only ever saw their own row.
 */
export async function getFantasyStandings() {
  const [squads, aggregates] = await Promise.all([
    prisma.squad.findMany({
      include: { user: true, picks: { orderBy: { slot: "asc" } } },
    }),
    getPlayerAggregates(),
  ]);

  const byUid = new Map(aggregates.map((a) => [a.uid, a]));

  return squads
    .map((s) => {
      const roster = s.picks
        .map((p) => byUid.get(p.playerUid))
        .filter((p): p is PlayerAggregate => Boolean(p));
      return {
        squadId: s.id,
        userId: s.userId,
        userName: s.user.name,
        squadName: s.name,
        roster,
        score: roster.reduce((sum, p) => sum + p.avgPower, 0),
      };
    })
    .sort((a, b) => b.score - a.score || a.squadName.localeCompare(b.squadName));
}

/** Predictor standings by banked points, then by outright winners called. */
export async function getPredictorStandings() {
  const users = await prisma.user.findMany({
    include: { predictions: true },
  });

  return users
    .map((u) => ({
      userId: u.id,
      name: u.name,
      points: u.predictions.reduce((s, p) => s + p.pointsAwarded, 0),
      picks: u.predictions.length,
      perfect: u.predictions.filter((p) => p.pointsAwarded === 10).length,
    }))
    .filter((u) => u.picks > 0)
    .sort((a, b) => b.points - a.points || b.perfect - a.perfect);
}
