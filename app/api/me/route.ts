import { readCookie } from "@/lib/http/cookies";
import { SESSION_COOKIE, userIdForSession } from "@/lib/auth/session";

// Tells the review page whether to show Send or "Sign in first". Returns nothing else.
export async function GET(req: Request) {
  const userId = await userIdForSession(readCookie(req, SESSION_COOKIE));
  return Response.json({ signedIn: !!userId }, { headers: { "cache-control": "no-store" } });
}
