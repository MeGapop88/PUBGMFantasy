/**
 * SCHEDULE HELPERS
 * Pure functions for translating a tournament day's opensAt/locksAt window
 * (from api.getSchedule()) plus a match's played/unplayed state into a
 * status the Predictions UI can gate on.
 */

/**
 * 'UPCOMING'  — day hasn't opened for picks yet
 * 'OPEN'      — day is open, users may submit/change picks
 * 'LOCKED'    — day's pick window has closed
 */
export function getDayStatus(day, now = new Date()) {
  if (now < new Date(day.opensAt)) return 'UPCOMING';
  if (now < new Date(day.locksAt)) return 'OPEN';
  return 'LOCKED';
}

/**
 * Layers a match's result availability on top of its day's lock status:
 * 'UPCOMING' | 'OPEN' | 'LOCKED_PENDING_RESULTS' | 'RESOLVED'
 */
export function getMatchStatus(match, day, now = new Date()) {
  const dayStatus = getDayStatus(day, now);
  if (dayStatus !== 'LOCKED') return dayStatus;
  return match.hasResults ? 'RESOLVED' : 'LOCKED_PENDING_RESULTS';
}

/**
 * Finds the DayEntry (from schedule.days) that contains a given matchId.
 */
export function findDayForMatch(schedule, matchId) {
  return schedule.days.find(d => d.matchIds.includes(matchId)) ?? null;
}
