/**
 * DATA LOADER
 * Takes a roster + schedule + raw match payloads (sourced from data/api.js)
 * and builds Finals Tournament Standings & player/team aggregates.
 * Computes official PUBG Mobile placement points & Player Power Scores.
 */
import { getRoster, getSchedule, getMatchRaw } from './api.js';

// Official PUBG Mobile Placement Points Lookup
export const OFFICIAL_PLACEMENT_PTS = {
  1: 10,
  2: 6,
  3: 5,
  4: 4,
  5: 3,
  6: 2,
  7: 1,
  8: 1,
  9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0
};

/**
 * Calculates a player's Power Score for a single match
 * Based on: Kills (12), Knockouts/KP (4), Damage (0.08), Survival Minutes (1.5)
 */
export function calculateMatchPower(p) {
  const killPts = (p.eliminations || 0) * 12;
  const koPts   = (p.knockdowns || 0) * 4;
  const dmgPts  = (p.damage || 0) * 0.08;
  const survMin = (p.survivalTime || 0) / 60;
  const survPts = survMin * 1.5;
  const rawPower = killPts + koPts + dmgPts + survPts;
  return Math.round(rawPower * 10) / 10;
}

/**
 * Processes raw JSON into a structured match object. When `raw` is null
 * (match not played yet — see api.getMatchRaw), returns a stub match with
 * zeroed-out counts and hasResults: false, so unplayed matches still show up
 * in schedules/predictions instead of silently disappearing.
 */
function processMatch(meta, raw) {
  const players = raw ? (raw[0]?.allinfo?.TotalPlayerList ?? []) : [];
  if (players.length === 0) {
    return {
      ...meta,
      players: [],
      teams: [],
      playerCount: 0,
      teamCount: 0,
      winner: null,
      topKiller: null,
      topDamage: null,
      topPower: null,
      hasResults: false,
    };
  }

  // Build player rows with normalized field names
  const playerRows = players.map(p => {
    const row = {
      uId:          String(p.uId),
      playerName:   p.playerName,
      teamId:       p.teamId,
      teamName:     p.teamName,
      eliminations: p.killNum       ?? 0,
      damage:       p.damage        ?? 0,
      heal:         p.heal          ?? 0,
      survivalTime: p.survivalTime  ?? 0,  // seconds
      knockdowns:   p.knockouts     ?? 0,
      rank:         p.rank          ?? 16, // team placement
      assists:      p.assists       ?? 0,
      headShots:    p.headShotNum   ?? 0,
      maxKillDist:  p.maxKillDistance ?? 0,
      inDamage:     p.inDamage      ?? 0,
      driveDistance:p.driveDistance ?? 0,
      marchDistance:p.marchDistance ?? 0,
    };
    row.power = calculateMatchPower(row);
    return row;
  });

  // Build team standings for this match
  const teamMap = {};
  playerRows.forEach(p => {
    if (!teamMap[p.teamId]) {
      const placePts = OFFICIAL_PLACEMENT_PTS[p.rank] ?? 0;
      teamMap[p.teamId] = {
        teamId:      p.teamId,
        teamName:    p.teamName,
        rank:        p.rank,
        placePts,
        totalKills:  0,
        totalDamage: 0,
        totalPower:  0,
        players:     [],
      };
    }
    teamMap[p.teamId].players.push(p);
    teamMap[p.teamId].totalKills  += p.eliminations;
    teamMap[p.teamId].totalDamage += p.damage;
    teamMap[p.teamId].totalPower  += p.power;
  });

  const teams = Object.values(teamMap).map(t => ({
    ...t,
    totalMatchPts: t.placePts + t.totalKills,
  })).sort((a, b) => a.rank - b.rank);

  return {
    ...meta,
    players: playerRows,
    teams,
    playerCount: playerRows.length,
    teamCount: teams.length,
    winner: teams.find(t => t.rank === 1) ?? null,
    topKiller: [...playerRows].sort((a, b) => b.eliminations - a.eliminations)[0] ?? null,
    topDamage: [...playerRows].sort((a, b) => b.damage - a.damage)[0] ?? null,
    topPower:  [...playerRows].sort((a, b) => b.power - a.power)[0] ?? null,
    hasResults: true,
  };
}

/**
 * Builds overall Finals Tournament Standings across all 18 Finals matches.
 * Pre-seeded from the roster so every team gets a row (all zeros) even
 * before any Finals matches have been played.
 */
export function computeFinalsStandings(roster, matches) {
  const finalsMatches = matches.filter(m => m.phase === 'Finals' && m.hasResults);
  const targetMatches = finalsMatches.length > 0 ? finalsMatches : matches.filter(m => m.hasResults);

  const teamTotals = {};

  (roster?.teams ?? []).forEach(t => {
    teamTotals[t.teamName] = {
      teamId:        t.teamId,
      teamName:      t.teamName,
      matchesPlayed: 0,
      wins:          0,
      top3:          0,
      totalKills:    0,
      totalPlacePts: 0,
      totalDamage:   0,
      totalPoints:   0,
      placements:    [],
    };
  });

  targetMatches.forEach(match => {
    match.teams.forEach(t => {
      if (!teamTotals[t.teamName]) {
        teamTotals[t.teamName] = {
          teamId:        t.teamId,
          teamName:      t.teamName,
          matchesPlayed: 0,
          wins:          0, // WWCD
          top3:          0,
          totalKills:    0,
          totalPlacePts: 0,
          totalDamage:   0,
          totalPoints:   0,
          placements:    [],
        };
      }
      const entry = teamTotals[t.teamName];
      entry.matchesPlayed++;
      entry.totalKills     += t.totalKills;
      entry.totalDamage    += t.totalDamage;
      entry.totalPlacePts  += (OFFICIAL_PLACEMENT_PTS[t.rank] ?? 0);
      entry.totalPoints    += (OFFICIAL_PLACEMENT_PTS[t.rank] ?? 0) + t.totalKills;
      entry.placements.push(t.rank);
      if (t.rank === 1) entry.wins++;
      if (t.rank <= 3)  entry.top3++;
    });
  });

  const sorted = Object.values(teamTotals).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (b.totalKills !== a.totalKills) return b.totalKills - a.totalKills;
    if (a.totalDamage !== b.totalDamage) return a.totalDamage - b.totalDamage;
    return a.teamName.localeCompare(b.teamName);
  });

  return sorted.map((t, idx) => ({
    ...t,
    tournamentRank: idx + 1,
    avgKills: (t.totalKills / (t.matchesPlayed || 1)).toFixed(1),
    avgPlacement: (t.placements.reduce((s, p) => s + p, 0) / (t.placements.length || 1)).toFixed(1),
  }));
}

/**
 * Builds per-player aggregate across all matches. Pre-seeded from the roster
 * so a player who hasn't played any matches yet still appears with every
 * stat defaulted to 0, instead of not existing at all.
 */
function buildPlayerRegistry(roster, matches) {
  const registry = {};

  (roster?.players ?? []).forEach(p => {
    registry[p.uId] = {
      uId:               p.uId,
      playerName:        p.playerName,
      teamId:            p.teamId,
      teamName:          p.teamName,
      matchesPlayed:     0,
      totalEliminations: 0,
      totalDamage:       0,
      totalKnockdowns:   0,
      totalSurvivalTime: 0,
      totalHeadShots:    0,
      totalAssists:      0,
      totalHeal:         0,
      totalPower:        0,
      perMatchStats:     [],
    };
  });

  matches.forEach(match => {
    match.players.forEach(p => {
      if (!registry[p.uId]) {
        console.warn(`Player ${p.uId} (${p.playerName}) played a match but is missing from the roster.`);
        registry[p.uId] = {
          uId:               p.uId,
          playerName:        p.playerName,
          teamId:            p.teamId,
          teamName:          p.teamName,
          matchesPlayed:     0,
          totalEliminations: 0,
          totalDamage:       0,
          totalKnockdowns:   0,
          totalSurvivalTime: 0,
          totalHeadShots:    0,
          totalAssists:      0,
          totalHeal:         0,
          totalPower:        0,
          perMatchStats:     [],
        };
      }
      const r = registry[p.uId];
      r.matchesPlayed++;
      r.totalEliminations += p.eliminations;
      r.totalDamage       += p.damage;
      r.totalKnockdowns   += p.knockdowns;
      r.totalSurvivalTime += p.survivalTime;
      r.totalHeadShots    += p.headShots;
      r.totalAssists      += p.assists;
      r.totalHeal         += p.heal;
      r.totalPower        += p.power;

      r.perMatchStats.push({
        matchId:      match.id,
        phase:        match.phase,
        day:          match.day,
        game:         match.game,
        rank:         p.rank,
        eliminations: p.eliminations,
        damage:       p.damage,
        knockdowns:   p.knockdowns,
        survivalTime: p.survivalTime,
        power:        p.power,
        assists:      p.assists,
        headShots:    p.headShots,
      });
    });
  });

  // Compute averages
  Object.values(registry).forEach(p => {
    p.avgEliminations = p.matchesPlayed > 0 ? p.totalEliminations / p.matchesPlayed : 0;
    p.avgDamage       = p.matchesPlayed > 0 ? p.totalDamage / p.matchesPlayed : 0;
    p.avgPower        = p.matchesPlayed > 0 ? Math.round((p.totalPower / p.matchesPlayed) * 10) / 10 : 0;
    p.avgSurvival     = p.matchesPlayed > 0 ? p.totalSurvivalTime / p.matchesPlayed : 0;
    p.kd              = p.matchesPlayed > 0 ? p.totalEliminations / p.matchesPlayed : 0;
  });

  return registry;
}

/**
 * Builds per-team aggregate across all matches. Pre-seeded from the roster
 * so every team has a row (all zeros) even before playing a match.
 */
function buildTeamRegistry(roster, matches) {
  const registry = {};

  (roster?.teams ?? []).forEach(t => {
    registry[t.teamId] = {
      teamId:        t.teamId,
      teamName:      t.teamName,
      matchesPlayed: 0,
      wins:          0,
      top3:          0,
      totalKills:    0,
      totalDamage:   0,
      totalPlacePts: 0,
      totalPoints:   0,
      placements:    [],
    };
  });

  matches.forEach(match => {
    match.teams.forEach(t => {
      if (!registry[t.teamId]) {
        registry[t.teamId] = {
          teamId:        t.teamId,
          teamName:      t.teamName,
          matchesPlayed: 0,
          wins:          0,
          top3:          0,
          totalKills:    0,
          totalDamage:   0,
          totalPlacePts: 0,
          totalPoints:   0,
          placements:    [],
        };
      }
      const r = registry[t.teamId];
      r.matchesPlayed++;
      r.totalKills     += t.totalKills;
      r.totalDamage    += t.totalDamage;
      r.totalPlacePts  += (OFFICIAL_PLACEMENT_PTS[t.rank] ?? 0);
      r.totalPoints    += (OFFICIAL_PLACEMENT_PTS[t.rank] ?? 0) + t.totalKills;
      r.placements.push(t.rank);
      if (t.rank === 1) r.wins++;
      if (t.rank <= 3)  r.top3++;
    });
  });

  Object.values(registry).forEach(t => {
    t.avgPlacement = t.placements.reduce((s, p) => s + p, 0) / (t.placements.length || 1);
    t.avgKills     = t.totalKills / (t.matchesPlayed || 1);
  });

  return registry;
}

/**
 * Parses a matchId like "Finals_D2_G3" into { phase, day, game, id }.
 */
function parseMatchId(id) {
  const [phase, dPart, gPart] = id.split('_');
  return { phase, day: parseInt(dPart.replace('D', ''), 10), game: parseInt(gPart.replace('G', ''), 10), id };
}

/**
 * Computes whether a player's most recent match power is trending up or
 * down relative to their rolling average of everything before it.
 * Returns null when there isn't enough history (0-1 matches) to judge a
 * trend, or when the change is too small (<5%) to call either direction.
 */
export function computePlayerTrend(perMatchStatsChronological) {
  if (!perMatchStatsChronological || perMatchStatsChronological.length < 2) return null;
  const last = perMatchStatsChronological[perMatchStatsChronological.length - 1];
  const prior = perMatchStatsChronological.slice(0, -1);
  const priorAvg = prior.reduce((s, m) => s + m.power, 0) / prior.length;
  if (priorAvg === 0) return null;
  const pctChange = (last.power - priorAvg) / priorAvg;
  if (Math.abs(pctChange) < 0.05) return 'flat';
  return pctChange > 0 ? 'up' : 'down';
}

/**
 * Main loader — fetches the roster + schedule, then every match's raw
 * telemetry (or a stub if unplayed), and builds all aggregates from them.
 */
export async function loadAllMatches(onProgress) {
  const roster = await getRoster();
  const schedule = await getSchedule();
  const matchIds = schedule.days.flatMap(d => d.matchIds);

  const results = [];
  let loaded = 0;

  const batchSize = 6;
  for (let i = 0; i < matchIds.length; i += batchSize) {
    const batch = matchIds.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(async matchId => {
      const meta = parseMatchId(matchId);
      const raw = await getMatchRaw(matchId);
      const match = processMatch(meta, raw);
      loaded++;
      onProgress && onProgress(loaded, matchIds.length);
      return match;
    }));
    results.push(...batchResults);
  }

  const sortedMatches = results.sort((a, b) => {
    if (a.phase !== b.phase) return a.phase.localeCompare(b.phase);
    if (a.day !== b.day) return a.day - b.day;
    return a.game - b.game;
  });

  const playerRegistry = buildPlayerRegistry(roster, sortedMatches);
  const teamRegistry   = buildTeamRegistry(roster, sortedMatches);
  const finalsStandings = computeFinalsStandings(roster, sortedMatches);

  return {
    matches: sortedMatches,
    players: playerRegistry,
    teams:   teamRegistry,
    finalsStandings,
    roster,
    schedule,
    loadedCount: sortedMatches.length,
    totalCount:  matchIds.length,
  };
}
