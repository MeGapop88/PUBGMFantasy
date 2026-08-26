/**
 * DATA LOADER
 * Loads all 36 PMGO JSON match files from /public/data/
 * Parses filenames: "Finals D1 G1.json" → { phase, day, game }
 * Builds a unified in-memory match store.
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
 * Returns null on error (file not placed yet).
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
 * Processes raw JSON into a structured match object.
 * @param {object} meta  — parsed filename metadata
 * @param {Array}  raw   — raw JSON data ([{ allinfo: { TotalPlayerList: [...] } }])
 * @returns {object} match
 */
function processMatch(meta, raw) {
  const players = raw[0]?.allinfo?.TotalPlayerList ?? [];

  if (players.length === 0) return null;

  // Build player rows with normalized field names
  const playerRows = players.map(p => ({
    uId:          String(p.uId),
    playerName:   p.playerName,
    teamId:       p.teamId,
    teamName:     p.teamName,
    // Fantasy scoring fields (spec §3.2)
    eliminations: p.killNum       ?? 0,
    damage:       p.damage        ?? 0,
    heal:         p.heal          ?? 0,
    survivalTime: p.survivalTime  ?? 0,  // seconds
    knockdowns:   p.knockouts     ?? 0,
    // Extra fields
    rank:         p.rank          ?? 16, // team final placement
    assists:      p.assists       ?? 0,
    headShots:    p.headShotNum   ?? 0,
    maxKillDist:  p.maxKillDistance ?? 0,
    inDamage:     p.inDamage      ?? 0,
    driveDistance:p.driveDistance ?? 0,
    marchDistance:p.marchDistance ?? 0,
  }));

  // Derive per-match totals for MVP formula
  const totals = {
    damage:       playerRows.reduce((s, p) => s + p.damage, 0),
    survivalTime: playerRows.reduce((s, p) => s + p.survivalTime, 0),
    eliminations: playerRows.reduce((s, p) => s + p.eliminations, 0),
    knockdowns:   playerRows.reduce((s, p) => s + p.knockdowns, 0),
  };

  // Calculate MVP rate per player for this match
  playerRows.forEach(p => {
    const dmgShare  = totals.damage       > 0 ? p.damage       / totals.damage       : 0;
    const survShare = totals.survivalTime > 0 ? p.survivalTime / totals.survivalTime : 0;
    const elimShare = totals.eliminations > 0 ? p.eliminations / totals.eliminations : 0;
    const koShare   = totals.knockdowns   > 0 ? p.knockdowns   / totals.knockdowns   : 0;

    p.mvpRate = (dmgShare * 0.3) + (survShare * 0.2) + (elimShare * 0.4) + (koShare * 0.1);
  });

  // Build team standings (one row per unique teamId)
  const teamMap = {};
  playerRows.forEach(p => {
    if (!teamMap[p.teamId]) {
      teamMap[p.teamId] = {
        teamId:   p.teamId,
        teamName: p.teamName,
        rank:     p.rank,
        players:  [],
        totalKills:  0,
        totalDamage: 0,
      };
    }
    teamMap[p.teamId].players.push(p.uId);
    teamMap[p.teamId].totalKills  += p.eliminations;
    teamMap[p.teamId].totalDamage += p.damage;
  });

  const teams = Object.values(teamMap).sort((a, b) => a.rank - b.rank);

  return {
    ...meta,
    players: playerRows,
    teams,
    totals,
    playerCount: playerRows.length,
    teamCount: teams.length,
    winner: teams.find(t => t.rank === 1) ?? null,
    topKiller: [...playerRows].sort((a, b) => b.eliminations - a.eliminations)[0] ?? null,
    topDamage: [...playerRows].sort((a, b) => b.damage - a.damage)[0] ?? null,
    topMvp:    [...playerRows].sort((a, b) => b.mvpRate - a.mvpRate)[0] ?? null,
  };
}

/**
 * Main loader — loads all available matches.
 * Returns { matches, players, teams, loadedCount, totalCount }
 */
export async function loadAllMatches(onProgress) {
  const results = [];
  let loaded = 0;

  // Load in parallel batches of 6 for speed
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

  // Build global player registry (uId → player aggregate)
  const playerRegistry = buildPlayerRegistry(results);

  // Build team registry
  const teamRegistry = buildTeamRegistry(results);

  return {
    matches: results.sort((a, b) => {
      if (a.phase !== b.phase) return a.phase.localeCompare(b.phase);
      if (a.day !== b.day) return a.day - b.day;
      return a.game - b.game;
    }),
    players: playerRegistry,
    teams:   teamRegistry,
    loadedCount: results.length,
    totalCount:  MATCH_FILES.length,
  };
}

/**
 * Builds a per-player aggregate across all matches.
 */
function buildPlayerRegistry(matches) {
  const registry = {};

  matches.forEach(match => {
    match.players.forEach(p => {
      if (!registry[p.uId]) {
        registry[p.uId] = {
          uId:        p.uId,
          playerName: p.playerName,
          teamId:     p.teamId,
          teamName:   p.teamName,
          matchesPlayed: 0,
          totalEliminations: 0,
          totalDamage: 0,
          totalKnockdowns: 0,
          totalSurvivalTime: 0,
          totalHeadShots: 0,
          totalAssists: 0,
          totalHeal: 0,
          totalMvpRate: 0,
          perMatchStats: [],
        };
      }
      const r = registry[p.uId];
      r.matchesPlayed++;
      r.totalEliminations   += p.eliminations;
      r.totalDamage         += p.damage;
      r.totalKnockdowns     += p.knockdowns;
      r.totalSurvivalTime   += p.survivalTime;
      r.totalHeadShots      += p.headShots;
      r.totalAssists        += p.assists;
      r.totalHeal           += p.heal;
      r.totalMvpRate        += p.mvpRate;
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
        mvpRate:      p.mvpRate,
      });
    });
  });

  // Compute averages
  Object.values(registry).forEach(p => {
    p.avgEliminations = p.matchesPlayed > 0 ? p.totalEliminations / p.matchesPlayed : 0;
    p.avgDamage       = p.matchesPlayed > 0 ? p.totalDamage / p.matchesPlayed : 0;
    p.avgMvpRate      = p.matchesPlayed > 0 ? p.totalMvpRate / p.matchesPlayed : 0;
    p.avgSurvival     = p.matchesPlayed > 0 ? p.totalSurvivalTime / p.matchesPlayed : 0;
    p.kd              = p.matchesPlayed > 0 ? p.totalEliminations / p.matchesPlayed : 0;
  });

  return registry;
}

/**
 * Builds a per-team aggregate across all matches.
 */
function buildTeamRegistry(matches) {
  const registry = {};

  matches.forEach(match => {
    match.teams.forEach(t => {
      if (!registry[t.teamId]) {
        registry[t.teamId] = {
          teamId:   t.teamId,
          teamName: t.teamName,
          matchesPlayed: 0,
          wins: 0,
          top3: 0,
          totalKills: 0,
          totalDamage: 0,
          placements: [],
        };
      }
      const r = registry[t.teamId];
      r.matchesPlayed++;
      r.totalKills  += t.totalKills;
      r.totalDamage += t.totalDamage;
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
