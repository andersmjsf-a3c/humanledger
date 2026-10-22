// Scorecards made by the site's own pages. Typed values only (rule 1); nothing is sent from here.
// The person reviews every card on /review and sends it with a click (rule 2).

export const SITE_MAKER = "site1.0";
export const SCHEMA_VERSION = "1.2";

const today = (d = new Date()) => d.toISOString().slice(0, 10);

export type Card = Record<string, unknown>;

export function worksheetCard(opts: { worksheetId: string; revisited: boolean; checkStepDone?: boolean; now?: Date }): Card {
  return {
    kind: "worksheet",
    schema_version: SCHEMA_VERSION,
    grading_skill_version: SITE_MAKER,
    graded_on: today(opts.now),
    worksheet_id: opts.worksheetId,
    status: opts.revisited ? "revisited_v2" : "completed",
    ...(opts.checkStepDone !== undefined ? { check_step_done: opts.checkStepDone } : {}),
  };
}

export function lengthBand(words: number): string {
  return words < 300 ? "under_300_words" : words <= 1000 ? "300_to_1000" : words <= 3000 ? "1000_to_3000" : "over_3000";
}

export type ThreeMinute = "passed" | "failed" | "skipped" | "not_applicable";

const nonEmpty = (o: Record<string, number>) => Object.keys(o).length > 0;

// A card from one run of the draft checker, plus the A5 checks the reader ticked.
export function checkCard(opts: {
  words: number;
  aiTellFlags: Record<string, number>;
  voiceFlags: Record<string, number>;
  deliverableType?: string;
  threeMinute?: ThreeMinute;
  unverifiedLine?: boolean;
  now?: Date;
}): Card {
  return {
    kind: "deliverable",
    schema_version: SCHEMA_VERSION,
    grading_skill_version: SITE_MAKER,
    graded_on: today(opts.now),
    ...(opts.deliverableType ? { deliverable_type: opts.deliverableType } : {}),
    length_band: lengthBand(opts.words),
    ...(nonEmpty(opts.aiTellFlags) ? { ai_tell_flags_found: opts.aiTellFlags } : {}),
    ...(nonEmpty(opts.voiceFlags) ? { voice_flags_found: opts.voiceFlags } : {}),
    ...(opts.threeMinute ? { three_minute_test: opts.threeMinute } : {}),
    ...(opts.unverifiedLine !== undefined ? { unverified_line: opts.unverifiedLine } : {}),
  };
}

const REQUIRED: Record<string, string[]> = {
  deliverable: ["kind", "schema_version", "grading_skill_version", "graded_on"],
  skill_retest: ["kind", "schema_version", "grading_skill_version", "graded_on", "skill_slot", "skill_version"],
  worksheet: ["kind", "schema_version", "grading_skill_version", "graded_on", "worksheet_id", "status"],
};

export function requiredKeys(card: Card): string[] {
  return REQUIRED[String(card.kind)] ?? Object.keys(card);
}

// "Hold back any line": drop optional fields the person unticked. Required fields stay.
export function holdBack(card: Card, held: string[]): Card {
  const req = new Set(requiredKeys(card));
  return Object.fromEntries(Object.entries(card).filter(([k]) => req.has(k) || !held.includes(k)));
}
