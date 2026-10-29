import { redeemLoginToken, sessionCookieHeader } from "@/lib/auth/session";
import { log } from "@/lib/log";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const sessionId = token ? await redeemLoginToken(token) : null;
  log({ event: "login_verify", route: "/api/auth/verify", status: sessionId ? 303 : 400 });
  if (!sessionId) return new Response(null, { status: 303, headers: { location: "/login?error=expired", "cache-control": "no-store" } });
  return new Response(null, {
    status: 303,
    headers: { location: "/after-sign-in", "set-cookie": sessionCookieHeader(sessionId), "cache-control": "no-store" },
  });
}
