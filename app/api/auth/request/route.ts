import { createLoginToken, normalizeEmail } from "@/lib/auth/session";
import { sendSignInLink } from "@/lib/auth/email";
import { log } from "@/lib/log";

// Same answer whether or not the address has an account, so nobody can probe who's signed up.
const SENT = "If that address is valid, a sign-in link is on its way.";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const email = normalizeEmail(String(form?.get("email") ?? ""));
  if (email) {
    const token = await createLoginToken(email);
    const link = `${process.env.APP_URL}/api/auth/verify?token=${encodeURIComponent(token)}`;
    await sendSignInLink(email, link);
  }
  log({ event: "login_requested", route: "/api/auth/request", status: 200 });
  return new Response(SENT, { status: 200, headers: { "content-type": "text/plain" } });
}
