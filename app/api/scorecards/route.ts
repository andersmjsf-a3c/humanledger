import { getDb } from "@/lib/db/client";
import { scorecards } from "@/lib/db/schema";
import { humanOnlyGuard } from "@/lib/http/guards";
import { readCookie } from "@/lib/http/cookies";
import { SESSION_COOKIE, userIdForSession } from "@/lib/auth/session";
import { checkCard, MAX_CARD_BYTES } from "@/lib/scorecard/validate";
import { log } from "@/lib/log";

const ROUTE = "/api/scorecards";

function fail(status: number, errorCode: string, errors?: string[]) {
  log({ event: "scorecard_rejected", route: ROUTE, status, errorCode });
  return Response.json({ error: errorCode, ...(errors ? { details: errors } : {}) }, { status });
}

// The only way into the ledger. The person clicks Send on the review page; nothing else can call this.
export async function POST(req: Request) {
  const guard = humanOnlyGuard(req);
  if (!guard.ok) return fail(guard.status, guard.code);

  const userId = await userIdForSession(readCookie(req, SESSION_COOKIE));
  if (!userId) return fail(401, "not_signed_in");

  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > MAX_CARD_BYTES) return fail(413, "too_large");

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "not_json");
  }

  const verdict = checkCard(body);
  if (!verdict.ok) return fail(422, "invalid_card", verdict.errors);

  const { card } = verdict;
  const [row] = await getDb()
    .insert(scorecards)
    .values({ userId, kind: card.kind, schemaVersion: card.schema_version, gradedOn: card.graded_on, card })
    .returning({ id: scorecards.id });

  log({ event: "scorecard_received", route: ROUTE, status: 201, kind: card.kind });
  return Response.json({ id: row.id }, { status: 201 });
}
