/**
 * SCORING — the only place points are computed.
 *
 * Pure: no imports, no I/O, no database. Everything here is called from both
 * the seed (which precomputes Power Scores and team results) and the server
 * actions (which enforce the rules a client can only suggest).
 */

// ------------------------------------------------------------ match points

/**
 * Official PUBG Mobile Esports placement points, indexed by finish.
 * 9th–16th score nothing.
 */
export const PLACEMENT_POINTS: readonly number[] = [
  10, 6, 5, 4, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
];

/** Placement points for a finish (1–16). Anything off the table scores 0. */
export function placementPoints(rank: number): number {
  return PLACEMENT_POINTS[rank - 1] ?? 0;
}

/** A team's total for one match: placement points plus one point per kill. */
export function teamMatchPoints(rank: number, kills: number): number {
  return placementPoints(rank) + kills;
}

// ------------------------------------------------------------- power score

/** The telemetry a Power Score is computed from. */
export type PowerInput = {
  killNum: number;
  knockouts: number;
  damage: number;
  /** Seconds. */
  survivalTime: number;
};

export const POWER_WEIGHTS = {
  kill: 12,
  knockout: 4,
  damage: 0.08,
  /** Per minute survived, not per second. */
  survivalMinute: 1.5,
} as const;

/**
 * A player's Power Score for a single match, rounded to one decimal.
 *
 * Unlike an MVP *share*, this is an absolute figure — it does not depend on
 * what the other 63 players did, so a score is comparable across matches and a
 * squad total is just a sum.
 */
export function matchPower(p: PowerInput): number {
  const raw =
    (p.killNum || 0) * POWER_WEIGHTS.kill +
    (p.knockouts || 0) * POWER_WEIGHTS.knockout +
    (p.damage || 0) * POWER_WEIGHTS.damage +
    ((p.survivalTime || 0) / 60) * POWER_WEIGHTS.survivalMinute;

  return Math.round(raw * 10) / 10;
}

// -------------------------------------------------------------- predictions

/**
 * Payout for a pick, by where the picked team actually finished. Calling an
 * outright winner is worth ten times a fifth-place hedge; 6th–16th score
 * nothing.
 */
export const PREDICTION_PAYOUT: readonly number[] = [10, 8, 5, 3, 1];

export function predictionPayout(actualRank: number): number {
  return PREDICTION_PAYOUT[actualRank - 1] ?? 0;
}

// ------------------------------------------------------------- squad rules

export const SQUAD_SIZE = 4;
export const MAX_PER_TEAM = 2;

export type SquadCandidate = { uid: string; teamId: number; teamName?: string };

/**
 * Squad rules: exactly 4 operatives, all distinct, at most 2 from any one real
 * team. Returns an error message, or null when the squad is legal.
 *
 * Called in two places on purpose — the draft UI uses it to disable a card
 * before it can be clicked, and the server action uses it to enforce the same
 * rule against a request that never went through that UI.
 */
export function validateSquad(picks: SquadCandidate[]): string | null {
  if (picks.length !== SQUAD_SIZE) {
    return `Squad must consist of exactly ${SQUAD_SIZE} operatives.`;
  }

  const uids = new Set(picks.map((p) => p.uid));
  if (uids.size !== picks.length) {
    return "An operative cannot be drafted twice.";
  }

  const perTeam = new Map<number, number>();
  for (const p of picks) {
    const next = (perTeam.get(p.teamId) ?? 0) + 1;
    if (next > MAX_PER_TEAM) {
      return `Max ${MAX_PER_TEAM} operatives allowed from ${p.teamName ?? "one team"}.`;
    }
    perTeam.set(p.teamId, next);
  }

  return null;
}

/**
 * Whether adding this player would break the per-team cap, given what is
 * already drafted. The draft grid calls this per card.
 */
export function wouldExceedTeamCap(
  drafted: SquadCandidate[],
  candidate: SquadCandidate,
): boolean {
  if (drafted.some((p) => p.uid === candidate.uid)) return false; // already in, removing is fine
  const count = drafted.filter((p) => p.teamId === candidate.teamId).length;
  return count >= MAX_PER_TEAM;
}

// ------------------------------------------------------------------- trend

export type Trend = "up" | "down" | "flat";

/** Below this, a change isn't worth calling a direction. */
const TREND_THRESHOLD = 0.05;

/**
 * Whether a player's latest match is above or below their rolling average of
 * everything before it.
 *
 * `powersInMatchOrder` must be in true tournament order — League before
 * Finals. Ordering by phase name sorts "Finals" ahead of "League" and points
 * this at the wrong game, which is why every query feeding it orders by
 * `Match.order` instead.
 *
 * Returns null when there isn't enough history to judge.
 */
export function playerTrend(powersInMatchOrder: number[]): Trend | null {
  if (powersInMatchOrder.length < 2) return null;

  const last = powersInMatchOrder[powersInMatchOrder.length - 1];
  const prior = powersInMatchOrder.slice(0, -1);
  const priorAvg = prior.reduce((s, p) => s + p, 0) / prior.length;
  if (priorAvg === 0) return null;

  const pctChange = (last - priorAvg) / priorAvg;
  if (Math.abs(pctChange) < TREND_THRESHOLD) return "flat";
  return pctChange > 0 ? "up" : "down";
}
