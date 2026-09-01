"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { prisma } from "./db";
import { getDayStatus } from "./schedule";
import { predictionPayout, validateSquad } from "./scoring";
import { AFTER_LOGIN, createSession, destroySession, requireUser } from "./session";

export type ActionResult = { error: string } | { ok: true };

// -------------------------------------------------------------------- auth

/**
 * Deliberately permissive: one @, something either side, a dot in the domain.
 * Anything stricter rejects addresses that are actually valid, and only
 * delivery proves an address works anyway.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Addresses are not case-sensitive, so the stored key never is either. */
function normalizeEmail(raw: FormDataEntryValue | null): string {
  return String(raw ?? "").trim().toLowerCase();
}

export async function register(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return { error: "Callsign must be at least 2 characters." };
  if (!EMAIL.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 4) return { error: "Access code must be at least 4 characters." };

  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "That email is already registered. Please login." };
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: await bcrypt.hash(password, 10) },
  });
  await createSession(user.id);
  redirect(AFTER_LOGIN);
}

export async function login(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");

  const user = await prisma.user.findUnique({ where: { email } });
  // One message for both cases, so this can't be used to enumerate accounts.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Invalid email or access code." };
  }

  await createSession(user.id);
  redirect(AFTER_LOGIN);
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

// ------------------------------------------------------------- predictions

/**
 * Lock one pick for one match.
 *
 * The deadline is re-derived here from the match's own ScheduleDay row. The
 * client's idea of whether a day is open is presentation only — the Vite build
 * took the caller's word for it (`submitPrediction(…, { isOpen })`), which a
 * single console call defeated.
 */
export async function lockPrediction(matchKey: string, teamId: number): Promise<ActionResult> {
  const user = await requireUser();

  const match = await prisma.match.findUnique({
    where: { key: matchKey },
    include: { scheduleDay: true, results: true },
  });
  if (!match) return { error: "Unknown match." };

  const status = getDayStatus(match.scheduleDay);
  if (status !== "OPEN") {
    return {
      error:
        status === "UPCOMING"
          ? "This day has not opened for picks yet."
          : "Prediction window closed for this match.",
    };
  }

  if (!match.results.some((r) => r.teamId === teamId)) {
    // Also guards a team id that isn't in this match at all.
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return { error: "Unknown team." };
  }

  // Award immediately when the result is already known; otherwise 0 until
  // scoreResolvedPredictions runs.
  const points = match.hasResults
    ? predictionPayout(match.results.find((r) => r.teamId === teamId)?.rank ?? 99)
    : 0;

  await prisma.prediction.upsert({
    where: { userId_matchId: { userId: user.id, matchId: match.id } },
    create: { userId: user.id, matchId: match.id, teamId, pointsAwarded: points },
    update: { teamId, pointsAwarded: points },
  });

  revalidatePath("/predictions");
  revalidatePath("/leaderboard");
  return { ok: true };
}

/**
 * Score every pick whose match now has results. Idempotent — safe to call on
 * each predictions render, and cheap because it only touches unscored rows.
 */
export async function scoreResolvedPredictions(): Promise<void> {
  const pending = await prisma.prediction.findMany({
    where: { pointsAwarded: 0, match: { hasResults: true } },
    include: { match: { include: { results: true } } },
  });

  for (const p of pending) {
    const rank = p.match.results.find((r) => r.teamId === p.teamId)?.rank;
    if (rank === undefined) continue;
    const points = predictionPayout(rank);
    if (points === 0) continue; // already correct at 0
    await prisma.prediction.update({
      where: { id: p.id },
      data: { pointsAwarded: points },
    });
  }
}

// ----------------------------------------------------------------- fantasy

/**
 * Save a squad. The 2-per-team cap is enforced here, not only in the draft
 * grid — the grid disables a capped card, but nothing stops a request that
 * never went through the grid.
 */
export async function saveSquad(squadName: string, playerUids: string[]): Promise<ActionResult> {
  const user = await requireUser();

  const name = squadName.trim();
  if (!name) return { error: "Squad designation name required." };

  const players = await prisma.player.findMany({
    where: { uid: { in: playerUids } },
    include: { team: true },
  });
  // Compare against the distinct ids: `in` de-duplicates, so a squad listing the
  // same operative twice would otherwise fail this check and report a missing
  // player instead of the duplicate that validateSquad is about to catch.
  if (players.length !== new Set(playerUids).size) {
    return { error: "One or more operatives are not on the roster." };
  }

  // Preserve draft order so slot numbers match what the user saw.
  const ordered = playerUids.map((uid) => players.find((p) => p.uid === uid)!);
  const error = validateSquad(
    ordered.map((p) => ({ uid: p.uid, teamId: p.teamId, teamName: p.team.name })),
  );
  if (error) return { error };

  await prisma.squad.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      name,
      picks: { create: ordered.map((p, i) => ({ playerUid: p.uid, slot: i + 1 })) },
    },
    update: {
      name,
      lockedAt: new Date(),
      // Replace wholesale — slots are positional, so a partial update would
      // collide with the @@unique([squadId, slot]) constraint.
      picks: {
        deleteMany: {},
        create: ordered.map((p, i) => ({ playerUid: p.uid, slot: i + 1 })),
      },
    },
  });

  revalidatePath("/fantasy");
  revalidatePath("/leaderboard");
  return { ok: true };
}
