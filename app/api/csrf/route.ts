import { newToken } from "@/lib/auth/tokens";
import { CSRF_COOKIE } from "@/lib/http/guards";

// The review page calls this before Send, then echoes the token in the x-csrf-token header.
export async function GET() {
  const token = newToken();
  return Response.json(
    { token },
    {
      headers: {
        "set-cookie": `${CSRF_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`,
        "cache-control": "no-store",
      },
    },
  );
}
