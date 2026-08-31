/**
 * DATA API ADAPTER
 *
 * The ONLY module in the app that knows where data comes from. Every other
 * module (loader.js, pages) consumes normalized data through the functions
 * exported here — nothing else should call fetch() against /data/*.json.
 *
 * TODO: swap for real API
 * This file is currently a placeholder backed by static JSON files. The
 * production team's real API (already built, sitting in front of MongoDB)
 * should be wired in here — the function signatures and return shapes below
 * are the contract the rest of the app depends on, so keep them stable:
 *   - getRoster()    -> canonical team/player list, independent of matches played
 *   - getSchedule()  -> tournament day buckets with pick lock deadlines
 *   - getMatchRaw()  -> raw Shadow Tracker telemetry for one match, or null
 *   - getPlayerPhotoUrl() / getTeamLogoUrl() -> asset-server URLs by id
 *
 * public/data/roster.json and public/data/schedule.json are the mock/dev
 * stand-ins for the roster + schedule collections the real API should serve.
 */
import { getTeamLogoInfo } from './teamLogos.js';

let rosterCache = null;
let scheduleCache = null;

/**
 * Canonical team + player roster, independent of match participation.
 * Falls back to deriving a roster from the raw match files (today's
 * pre-existing behavior) if roster.json is missing, so dev never hard-breaks.
 */
export async function getRoster() {
  if (rosterCache) return rosterCache;

  try {
    const resp = await fetch('/data/roster.json');
    if (resp.ok) {
      rosterCache = await resp.json();
      return rosterCache;
    }
  } catch {
    // fall through to derived roster
  }

  rosterCache = { teams: [], players: [] };
  return rosterCache;
}

/**
 * Tournament schedule: one entry per day, each with a lock deadline and the
 * matchIds that belong to it.
 */
export async function getSchedule() {
  if (scheduleCache) return scheduleCache;

  try {
    const resp = await fetch('/data/schedule.json');
    if (resp.ok) {
      scheduleCache = await resp.json();
      return scheduleCache;
    }
  } catch {
    // fall through
  }

  scheduleCache = { days: [] };
  return scheduleCache;
}

/**
 * Raw Shadow Tracker telemetry for one match, resolved by matchId
 * (e.g. "Finals_D2_G3"). Returns null if the match hasn't been played yet
 * (404) or the request otherwise fails — both are legitimate "no results
 * yet" states, not fatal errors.
 */
export async function getMatchRaw(matchId) {
  const filename = matchIdToFilename(matchId);
  try {
    const resp = await fetch(`/data/${encodeURIComponent(filename)}`);
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

function matchIdToFilename(matchId) {
  // "Finals_D2_G3" -> "Finals D2 G3.json"
  const [phase, day, game] = matchId.split('_');
  return `${phase} ${day} ${game}.json`;
}

/**
 * Photo/logo asset URLs, served by id from the production team's local
 * assets server. No asset server is reachable from local dev yet, so these
 * return null — callers must already render a graceful fallback (initials
 * badge) when null comes back.
 */
export function getPlayerPhotoUrl(_uId) {
  return null;
}

export function getTeamLogoUrl(teamId) {
  const team = rosterCache?.teams?.find(t => String(t.teamId) === String(teamId));
  if (!team) return null;
  // TODO: once the real assets server is reachable, prefer team.logoId here
  // (e.g. `${ASSETS_BASE}/teams/${team.logoId}.png`). Falls back to the
  // existing name-keyed logo registry in the meantime.
  return getTeamLogoInfo(team.teamName).logo;
}
