import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { scorecards } from "@/lib/db/schema";

export type HistoryRow = { id: string; kind: string; gradedOn: string; receivedAt: Date; card: Record<string, unknown> };

// One person's own scorecards, newest first. The query is always scoped to the signed-in user.
export async function historyFor(userId: string, limit = 200): Promise<HistoryRow[]> {
  const rows = await getDb()
    .select({ id: scorecards.id, kind: scorecards.kind, gradedOn: scorecards.gradedOn, receivedAt: scorecards.receivedAt, card: scorecards.card })
    .from(scorecards)
    .where(and(eq(scorecards.userId, userId)))
    .orderBy(desc(scorecards.receivedAt))
    .limit(limit);
  return rows.map((r) => ({ ...r, gradedOn: String(r.gradedOn), card: r.card as Record<string, unknown> }));
}

// Latest status per worksheet, from the worksheet cards in a history.
export function worksheetStatus(rows: HistoryRow[]): Record<string, { status: string; gradedOn: string }> {
  const out: Record<string, { status: string; gradedOn: string }> = {};
  for (const r of rows) {
    if (r.kind !== "worksheet") continue;
    const id = String(r.card.worksheet_id);
    if (!out[id]) out[id] = { status: String(r.card.status), gradedOn: r.gradedOn };
  }
  return out;
}
