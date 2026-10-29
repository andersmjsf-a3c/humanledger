import { appUrl } from "@/config/app-url";
import { createLoginToken, normalizeEmail } from "@/lib/auth/session";
import { EmailError, sendSignInLink } from "@/lib/auth/email";
import { log } from "@/lib/log";

const ROUTE = "/api/auth/request";
const back = (query: string) => new Response(null, { status: 303, headers: { location: `/login?${query}` } });

// The sign-in form posts here and lands back on /login with a status. The answer is the same
// whether or not the address has an account, so nobody can probe who's signed up.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const email = normalizeEmail(String(form?.get("email") ?? ""));
  if (!email) {
    log({ event: "login_requested", route: ROUTE, status: 303, errorCode: "bad_email" });
    return back("error=email");
  }
  try {
    const token = await createLoginToken(email);
    await sendSignInLink(email, `${appUrl()}/api/auth/verify?token=${encodeURIComponent(token)}`);
  } catch (e) {
    // A failed send says nothing about the address, so it's safe to tell the person to try again.
    log({ event: "login_email_failed", route: ROUTE, status: 303, errorCode: e instanceof EmailError ? e.code : "send_failed" });
    return back("error=send");
  }
  log({ event: "login_requested", route: ROUTE, status: 303 });
  return back("sent=1");
}
