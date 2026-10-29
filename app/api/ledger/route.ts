import { readCookie } from "@/lib/http/cookies";
import { SESSION_COOKIE, userIdForSession } from "@/lib/auth/session";
import { historyFor } from "@/lib/history";

// The signed-in person's own scorecards, for their dashboard. Typed values only; nobody else's.
export async function GET(req: Request) {
  const userId = await userIdForSession(readCookie(req, SESSION_COOKIE));
  if (!userId) return Response.json({ error: "not_signed_in" }, { status: 401, headers: { "cache-control": "no-store" } });
  const rows = await historyFor(userId, 500);
  return Response.json({ cards: rows.map((r) => r.card) }, { headers: { "cache-control": "no-store" } });
}
