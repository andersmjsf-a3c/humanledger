import { readCookie } from "@/lib/http/cookies";
import { SESSION_COOKIE, clearedSessionCookie, endSession } from "@/lib/auth/session";
import { log } from "@/lib/log";

// Sign out: the session row goes, the cookie goes, back to the front page.
export async function POST(req: Request) {
  if (req.headers.get("sec-fetch-site") && req.headers.get("sec-fetch-site") !== "same-origin") {
    return new Response(null, { status: 403 });
  }
  await endSession(readCookie(req, SESSION_COOKIE));
  log({ event: "signed_out", route: "/api/auth/signout", status: 303 });
  return new Response(null, { status: 303, headers: { location: "/", "set-cookie": clearedSessionCookie, "cache-control": "no-store" } });
}
