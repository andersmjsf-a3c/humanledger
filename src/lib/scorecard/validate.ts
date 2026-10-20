import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import scorecardSchema from "@/schemas/scorecard.schema.json";
import coachSchema from "@/schemas/coach-recommendation.schema.json";

const ajv = new Ajv2020({ allErrors: true, strict: true, strictTuples: false });
addFormats(ajv);

const validateCard = ajv.compile(scorecardSchema);
export const validateCoachRecommendation = ajv.compile(coachSchema);

export const MAX_CARD_BYTES = 4096;
const EARLIEST = "2026-01-01";

export type Card = Record<string, unknown> & {
  kind: "deliverable" | "skill_retest" | "worksheet";
  schema_version: string;
  graded_on: string;
};

export type Verdict = { ok: true; card: Card } | { ok: false; errors: string[] };

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Rules the schema can't express. Mirrors server_checks() in check_scorecard.py.
function serverChecks(card: Record<string, any>, today: Date): string[] {
  const errs: string[] = [];
  const latest = isoDay(new Date(today.getTime() + 86_400_000));
  for (const k of ["graded_on", "last_edited_on"]) {
    if (k in card && (card[k] < EARLIEST || card[k] > latest)) errs.push(`${k} out of range`);
  }
  if ((card.facts_corrected ?? 0) > (card.facts_checked ?? 0)) errs.push("facts_corrected > facts_checked");
  if ((card.test_cases_passed ?? 0) > (card.test_cases_run ?? 0)) errs.push("test_cases_passed > test_cases_run");
  for (const [rem, found] of [
    ["voice_flags_remaining", "voice_flags_found"],
    ["ai_tell_flags_remaining", "ai_tell_flags_found"],
  ] as const) {
    for (const [k, v] of Object.entries(card[rem] ?? {})) {
      if ((v as number) > (card[found]?.[k] ?? 0)) errs.push(`${rem}.${k} > ${found}.${k}`);
    }
  }
  return errs;
}

export function checkCard(input: unknown, today = new Date()): Verdict {
  const size = new TextEncoder().encode(JSON.stringify(input ?? null)).length;
  if (size > MAX_CARD_BYTES) return { ok: false, errors: ["over 4 KB"] };
  if (!validateCard(input)) {
    return { ok: false, errors: (validateCard.errors ?? []).map((e) => `${e.instancePath || "/"} ${e.message}`) };
  }
  const errs = serverChecks(input as Record<string, any>, today);
  return errs.length ? { ok: false, errors: errs } : { ok: true, card: input as Card };
}
