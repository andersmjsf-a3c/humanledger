import { appUrl } from "@/config/app-url";
import { readCookie } from "./cookies";
import { safeEqual } from "@/lib/auth/tokens";

export const CSRF_COOKIE = "__Host-csrf";
export const CSRF_HEADER = "x-csrf-token";

export type GuardResult = { ok: true } | { ok: false; status: number; code: string };

// Rule 2 in code: a scorecard can only arrive from a signed-in browser, on our own origin,
// with a CSRF token. No bearer token, no API key, no machine path.
export function humanOnlyGuard(req: Request): GuardResult {
  if (req.headers.get("authorization")) return { ok: false, status: 401, code: "no_tokens_accepted" };
  for (const h of ["x-api-key", "api-key", "x-auth-token"]) {
    if (req.headers.get(h)) return { ok: false, status: 401, code: "no_tokens_accepted" };
  }
  const site = appUrl();
  const origin = req.headers.get("origin");
  if (!site || !origin || origin !== new URL(site).origin) {
    return { ok: false, status: 403, code: "bad_origin" };
  }
  if (req.headers.get("sec-fetch-site") && req.headers.get("sec-fetch-site") !== "same-origin") {
    return { ok: false, status: 403, code: "bad_origin" };
  }
  const cookie = readCookie(req, CSRF_COOKIE);
  const header = req.headers.get(CSRF_HEADER);
  if (!cookie || !header || !safeEqual(cookie, header)) return { ok: false, status: 403, code: "bad_csrf" };
  return { ok: true };
}
