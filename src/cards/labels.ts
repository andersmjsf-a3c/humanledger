// Plain words for every scorecard field and value, so the person reads exactly what would go.
// tests/11-cards.test.ts checks every field in scorecard.schema.json has a label here.
import type { Card } from "./build";

export const FIELD_LABELS: Record<string, string> = {
  kind: "What this records",
  schema_version: "Scorecard version",
  grading_skill_version: "Made by",
  graded_on: "Date",
  model_vendor: "AI company",
  model_release: "AI model",
  deliverable_type: "Type of work",
  audience: "Who it's for",
  length_band: "Length",
  brief_used: "Used a brief",
  skills_used: "Skills used",
  pass_count: "Passes",
  catches_me: "Catches you made",
  catches_tool: "Catches the tool made",
  catches_standard: "Catches from an outside standard",
  standard_kind: "Kind of standard",
  voice_flags_found: "Your rules broken",
  voice_flags_remaining: "Your rules still broken when sent",
  ai_tell_flags_found: "Signs of AI writing found",
  ai_tell_flags_remaining: "Signs of AI writing left when sent",
  fact_pass: "Fact pass",
  facts_checked: "Facts checked",
  facts_corrected: "Facts corrected",
  sources_opened: "Sources opened",
  three_minute_test: "Three-minute test",
  brand_check: "Brand check",
  released_after_check: "Sent only after checking",
  unverified_line: "Wrote the \"what I couldn't verify\" line",
  receipt: "What the grader touched",
  skill_slot: "Skill",
  skill_version: "Skill version",
  last_edited_on: "Skill last edited",
  trigger: "Why it was re-tested",
  test_cases_run: "Test cases run",
  test_cases_passed: "Test cases passed",
  drift_result: "Drift after the release",
  edited_after_retest: "Edited the skill after",
  run_by: "Run by",
  worksheet_id: "Worksheet",
  status: "Status",
  check_step_done: "Did the check step",
};

const VALUE_LABELS: Record<string, string> = {
  deliverable: "A piece of work",
  worksheet: "A worksheet",
  skill_retest: "A skill re-test",
  "site1.0": "This site",
  "g1.0": "Grading skill 1.0",
  "g1.1": "Grading skill 1.1",
  completed: "Completed",
  started: "Started",
  revisited_v2: "Revisited (version 2)",
  under_300_words: "Under 300 words",
  "300_to_1000": "300 to 1,000 words",
  "1000_to_3000": "1,000 to 3,000 words",
  over_3000: "Over 3,000 words",
  not_text: "Not text",
  passed: "Passed",
  failed: "Failed",
  skipped: "Skipped",
  not_applicable: "Doesn't apply",
  pass: "Passed",
  fail: "Failed",
  not_run: "Not run",
  // flag categories
  em_dash: "em dashes",
  banned_word: "banned words or phrases",
  hedge: "hedges",
  passive_frame: "passive framing",
  honesty_theater: "honesty framing",
  off_voice_other: "other off-voice",
  stock_phrase: "stock phrases",
  inflated_word: "inflated words",
  rule_of_three: "rule of three",
  negative_parallelism: "negative parallelism",
  uniform_rhythm: "uniform rhythm",
  generic_closer: "generic closers",
  tell_other: "other tells",
};

const value = (v: unknown): string => {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toLocaleString("en-US");
  if (typeof v === "string") return VALUE_LABELS[v] ?? v.replace(/_/g, " ");
  if (Array.isArray(v)) return v.map(value).join(", ") || "None";
  if (v && typeof v === "object") {
    const parts = Object.entries(v as Record<string, unknown>).map(([k, x]) => `${value(x)} ${VALUE_LABELS[k] ?? k.replace(/_/g, " ")}`);
    return parts.join(", ") || "None";
  }
  return String(v);
};

// Always in the schema's own order, whatever order the stored JSON comes back in.
const ORDER = Object.keys(FIELD_LABELS);
const rank = (k: string) => (ORDER.indexOf(k) + 1 || ORDER.length + 1);

export function rows(card: Card): { key: string; label: string; value: string }[] {
  return Object.entries(card)
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([k, v]) => ({ key: k, label: FIELD_LABELS[k] ?? k, value: value(v) }));
}

// A one-line title for a card in the history list.
export function cardTitle(card: Card): string {
  if (card.kind === "worksheet") return `Worksheet ${card.worksheet_id}`;
  if (card.kind === "skill_retest") return `Skill re-test, ${value(card.skill_slot)}`;
  const what = card.deliverable_type ? value(card.deliverable_type) : card.grading_skill_version === "site1.0" ? "Draft check" : "Graded work";
  const flags = card.ai_tell_flags_found ? Object.values(card.ai_tell_flags_found as Record<string, number>).reduce((a, b) => a + b, 0) : 0;
  const s = `${what}, ${value(card.length_band ?? "")}`.replace(/, $/, "") + (flags ? `, ${flags} signs of AI writing` : "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}
