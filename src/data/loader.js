/**
 * DATA LOADER
 * Loads all 36 PMGO JSON match files from /public/data/
 * Computes official PUBG Mobile placement points & Player Power Scores.
 * Builds Finals Tournament Standings & player/team aggregates.
 */

// All 36 match files
const MATCH_FILES = [
  // Finals
  'Finals D1 G1.json', 'Finals D1 G2.json', 'Finals D1 G3.json',
  'Finals D1 G4.json', 'Finals D1 G5.json', 'Finals D1 G6.json',
  'Finals D2 G1.json', 'Finals D2 G2.json', 'Finals D2 G3.json',
  'Finals D2 G4.json', 'Finals D2 G5.json', 'Finals D2 G6.json',
  'Finals D3 G1.json', 'Finals D3 G2.json', 'Finals D3 G3.json',
  'Finals D3 G4.json', 'Finals D3 G5.json', 'Finals D3 G6.json',
  // League
  'League D1 G1.json', 'League D1 G2.json', 'League D1 G3.json',
  'League D1 G4.json', 'League D1 G5.json', 'League D1 G6.json',
  'League D2 G1.json', 'League D2 G2.json', 'League D2 G3.json',
  'League D2 G4.json', 'League D2 G5.json', 'League D2 G6.json',
  'League D3 G1.json', 'League D3 G2.json', 'League D3 G3.json',
  'League D3 G4.json', 'League D3 G5.json', 'League D3 G6.json',
];

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
 * Parses a filename into match metadata.
 * "Finals D2 G3.json" → { phase: 'Finals', day: 2, game: 3, id: 'Finals_D2_G3' }
 */
function parseFilename(filename) {
  const name = filename.replace('.json', '');
  const parts = name.split(' ');
  const phase = parts[0]; // 'Finals' | 'League'
  const day = parseInt(parts[1].replace('D', ''), 10);
  const game = parseInt(parts[2].replace('G', ''), 10);
  return { phase, day, game, id: `${phase}_D${day}_G${game}`, filename };
}

/**
 * Loads a single match JSON file.
 */
async function loadMatchFile(filename) {
  try {
    const resp = await fetch(`/data/${encodeURIComponent(filename)}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    return data;
  } catch {
    return null;
  }
}

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
 * Processes raw JSON into a structured match object.
 */
function processMatch(meta, raw) {
  const players = raw[0]?.allinfo?.TotalPlayerList ?? [];
  if (players.length === 0) return null;

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
  };
}

/**
 * Builds overall Finals Tournament Standings across all 18 Finals matches.
 */
export function computeFinalsStandings(matches) {
  const finalsMatches = matches.filter(m => m.phase === 'Finals');
  const targetMatches = finalsMatches.length > 0 ? finalsMatches : matches;

  const teamTotals = {};

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
    return a.totalDamage - b.totalDamage;
  });

  return sorted.map((t, idx) => ({
    ...t,
    tournamentRank: idx + 1,
    avgKills: (t.totalKills / (t.matchesPlayed || 1)).toFixed(1),
    avgPlacement: (t.placements.reduce((s, p) => s + p, 0) / (t.placements.length || 1)).toFixed(1),
  }));
}

/**
 * Builds per-player aggregate across all matches.
 */
function buildPlayerRegistry(matches) {
  const registry = {};

  matches.forEach(match => {
    match.players.forEach(p => {
      if (!registry[p.uId]) {
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
 * Builds per-team aggregate across all matches.
 */
function buildTeamRegistry(matches) {
  const registry = {};

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
 * Main loader — loads all available matches.
 */
export async function loadAllMatches(onProgress) {
  const results = [];
  let loaded = 0;

  const batchSize = 6;
  for (let i = 0; i < MATCH_FILES.length; i += batchSize) {
    const batch = MATCH_FILES.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(async filename => {
      const meta = parseFilename(filename);
      const raw = await loadMatchFile(filename);
      if (!raw) return null;
      const match = processMatch(meta, raw);
      loaded++;
      onProgress && onProgress(loaded, MATCH_FILES.length);
      return match;
    }));
    results.push(...batchResults.filter(Boolean));
  }

  const sortedMatches = results.sort((a, b) => {
    if (a.phase !== b.phase) return a.phase.localeCompare(b.phase);
    if (a.day !== b.day) return a.day - b.day;
    return a.game - b.game;
  });

  const playerRegistry = buildPlayerRegistry(sortedMatches);
  const teamRegistry   = buildTeamRegistry(sortedMatches);
  const finalsStandings = computeFinalsStandings(sortedMatches);

  return {
    matches: sortedMatches,
    players: playerRegistry,
    teams:   teamRegistry,
    finalsStandings,
    loadedCount: sortedMatches.length,
    totalCount:  MATCH_FILES.length,
  };
}
