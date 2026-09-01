/**
 * SCHEDULE STATUS — pure functions, ported unchanged in behaviour from the
 * Vite build's src/data/schedule.js.
 *
 * What changed is who is trusted to run them. These still drive the UI, but the
 * `lockPrediction` server action re-derives the status from the database before
 * accepting a pick, so a client that lies about being open gets nowhere.
 */

export type DayWindow = { opensAt: Date | string; locksAt: Date | string };

/**
 * 'UPCOMING' — the day has not opened for picks yet
 * 'OPEN'     — picks may be submitted or changed
 * 'LOCKED'   — the pick window has closed
 */
export type DayStatus = "UPCOMING" | "OPEN" | "LOCKED";

export function getDayStatus(day: DayWindow, now: Date = new Date()): DayStatus {
  if (now < new Date(day.opensAt)) return "UPCOMING";
  if (now < new Date(day.locksAt)) return "OPEN";
  return "LOCKED";
}

export type MatchStatus = "UPCOMING" | "OPEN" | "LOCKED_PENDING_RESULTS" | "RESOLVED";

/** Layers a match's result availability on top of its day's lock status. */
export function getMatchStatus(
  match: { hasResults: boolean },
  day: DayWindow,
  now: Date = new Date(),
): MatchStatus {
  const dayStatus = getDayStatus(day, now);
  if (dayStatus !== "LOCKED") return dayStatus;
  return match.hasResults ? "RESOLVED" : "LOCKED_PENDING_RESULTS";
}
