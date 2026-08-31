// One-off script: derive roster.json + schedule.json from existing match files.
// Not part of the app runtime — run manually with `node scripts/build-roster.mjs`.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = join(process.cwd(), 'public', 'data');
const files = readdirSync(dataDir).filter(f => f.endsWith('.json') && f !== 'roster.json' && f !== 'schedule.json');

const teams = new Map(); // teamId -> { teamId, teamName }
const players = new Map(); // uId -> { uId, playerName, teamId, teamName }

for (const filename of files) {
  const raw = JSON.parse(readFileSync(join(dataDir, filename), 'utf-8'));
  const list = raw[0]?.allinfo?.TotalPlayerList ?? [];
  for (const p of list) {
    const teamId = p.teamId;
    const teamName = p.teamName;
    if (!teams.has(teamId)) teams.set(teamId, { teamId, teamName });
    const uId = String(p.uId);
    if (!players.has(uId)) {
      players.set(uId, { uId, playerName: p.playerName, teamId, teamName, photoId: null, role: null });
    }
  }
}

const teamList = [...teams.values()]
  .sort((a, b) => a.teamName.localeCompare(b.teamName))
  .map(t => ({
    teamId: t.teamId,
    teamName: t.teamName,
    shortCode: t.teamName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase(),
    color: '#FF6B00',
    logoId: null,
  }));

const playerList = [...players.values()].sort((a, b) => a.playerName.localeCompare(b.playerName));

const roster = { teams: teamList, players: playerList };

// Build schedule: one day-bucket per (phase, day) combo, matchIds in game order.
const dayMap = new Map(); // key "Phase_Dn" -> matchIds[]
for (const filename of files) {
  const name = filename.replace('.json', '');
  const parts = name.split(' ');
  const phase = parts[0];
  const day = parseInt(parts[1].replace('D', ''), 10);
  const game = parseInt(parts[2].replace('G', ''), 10);
  const id = `${phase}_D${day}_G${game}`;
  const key = `${phase}_D${day}`;
  if (!dayMap.has(key)) dayMap.set(key, { phase, day, matchIds: [] });
  dayMap.get(key).matchIds.push({ id, game });
}

const PHASE_ORDER = { League: 0, Finals: 1 };
const dayEntries = [...dayMap.values()]
  .sort((a, b) => (a.phase !== b.phase ? PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase] : a.day - b.day))
  .map(d => ({
    ...d,
    matchIds: d.matchIds.sort((a, b) => a.game - b.game).map(m => m.id),
  }));

// Placeholder timestamps for local demo/testing: day 0 already locked+resolved (in the past),
// day 1 currently OPEN (spans "now"), remaining days UPCOMING (start after day 1 locks).
const now = Date.now();
const HOUR = 60 * 60 * 1000;
let cursor = now - 2 * 24 * HOUR; // day 0 opened 2 days ago
const days = dayEntries.map((d, idx) => {
  let opensAt, locksAt;
  if (idx === 0) {
    opensAt = cursor;
    locksAt = cursor + 3 * HOUR; // locked well before "now"
  } else if (idx === 1) {
    opensAt = now - 5 * 60 * 1000; // opened 5 min ago
    locksAt = now + 3 * HOUR;      // still open for 3h
  } else {
    opensAt = cursor;
    locksAt = cursor + 3 * HOUR;
  }
  cursor = locksAt;
  return {
    day: d.day,
    phase: d.phase,
    label: `${d.phase} — Day ${d.day}`,
    opensAt: new Date(opensAt).toISOString(),
    locksAt: new Date(locksAt).toISOString(),
    matchIds: d.matchIds,
  };
});

const schedule = { days };

writeFileSync(join(dataDir, 'roster.json'), JSON.stringify(roster, null, 2));
writeFileSync(join(dataDir, 'schedule.json'), JSON.stringify(schedule, null, 2));

console.log(`roster.json: ${teamList.length} teams, ${playerList.length} players`);
console.log(`schedule.json: ${days.length} day-buckets`);
