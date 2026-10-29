import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { loginTokens, sessions, users } from "@/lib/db/schema";
import { hashToken, newToken } from "./tokens";

export const SESSION_COOKIE = "__Host-session";
const LINK_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function normalizeEmail(email: string): string | null {
  const e = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254 ? e : null;
}

// Creates a one-time sign-in token and returns the raw value (to be emailed, never stored).
export async function createLoginToken(email: string): Promise<string> {
  const token = newToken();
  await getDb().insert(loginTokens).values({
    tokenHash: hashToken(token),
    email,
    expiresAt: new Date(Date.now() + LINK_TTL_MS),
  });
  return token;
}

// Spends a sign-in token and returns a new raw session id, or null.
export async function redeemLoginToken(token: string): Promise<string | null> {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .update(loginTokens)
    .set({ usedAt: now })
    .where(and(eq(loginTokens.tokenHash, hashToken(token)), isNull(loginTokens.usedAt), gt(loginTokens.expiresAt, now)))
    .returning();
  if (!row) return null;

  let [user] = await db.select().from(users).where(eq(users.email, row.email));
  if (!user) [user] = await db.insert(users).values({ email: row.email }).returning();

  const sessionId = newToken();
  await db.insert(sessions).values({
    idHash: hashToken(sessionId),
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return sessionId;
}

export async function userIdForSession(sessionId: string | undefined): Promise<string | null> {
  if (!sessionId) return null;
  const [row] = await getDb()
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(and(eq(sessions.idHash, hashToken(sessionId)), gt(sessions.expiresAt, new Date())));
  return row?.userId ?? null;
}

export function sessionCookieHeader(sessionId: string): string {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `${SESSION_COOKIE}=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export async function endSession(sessionId: string | undefined): Promise<void> {
  if (!sessionId) return;
  await getDb().delete(sessions).where(eq(sessions.idHash, hashToken(sessionId)));
}

export const clearedSessionCookie = `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
