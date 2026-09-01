import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "./db";

const COOKIE = "pmgo_session";

/**
 * Where a session lands once it exists — after signing in, after registering,
 * and when an already-authenticated visitor hits /login. One constant so those
 * three exits can't drift apart.
 */
export const AFTER_LOGIN = "/fantasy";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Opaque database-backed sessions rather than a signed JWT: revoking one is a
 * DELETE, and there is no signing key to rotate or leak.
 *
 * This replaces the old `pmgo_session` localStorage blob, which sat next to a
 * `pmgo_users` map holding every password in plaintext.
 */
export async function createSession(userId: string): Promise<void> {
  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + MAX_AGE_SECONDS * 1000),
    },
  });

  const jar = await cookies();
  jar.set(COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export type SessionUser = { id: string; name: string; email: string };

/** The current user, or null. Expired rows are deleted on sight. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (!id) return null;

  const session = await prisma.session.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id } }).catch(() => {});
    return null;
  }
  return session.user;
}

/** Same, but sends anonymous visitors to the login screen. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;
  if (id) await prisma.session.delete({ where: { id } }).catch(() => {});
  jar.delete(COOKIE);
}
