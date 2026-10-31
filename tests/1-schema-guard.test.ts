// Privacy guard 1: the scorecard and coach schemas admit no free text.
// TypeScript twin of check_scorecard.py.
import { describe, it, expect } from "vitest";
import scorecardSchema from "@/schemas/scorecard.schema.json";
import coachSchema from "@/schemas/coach-recommendation.schema.json";
import { checkCard, validateCoachRecommendation } from "@/lib/scorecard/validate";
import { base } from "./helpers";

type Node = Record<string, any>;
const today = new Date("2026-10-18T12:00:00Z");

function auditSchema(root: Node, label: string): string[] {
  const defs: Node = root.$defs ?? {};
  const resolve = (n: Node): Node => {
    while (n.$ref) n = defs[n.$ref.split("/").pop()];
    return n;
  };
  const problems: string[] = [];
  const walk = (raw: Node, path: string) => {
    const n = resolve(raw);
    if ("enum" in n || "const" in n) return;
    switch (n.type) {
      case "string":
        if (!(n.format === "date" && n.pattern)) problems.push(`${path}: open string`);
        break;
      case "integer":
        if (n.minimum === undefined || n.maximum === undefined) problems.push(`${path}: unbounded integer`);
        break;
      case "boolean":
        break;
      case "array":
        if (n.maxItems === undefined || !n.uniqueItems) problems.push(`${path}: uncapped array`);
        walk(n.items, `${path}[]`);
        break;
      case "object":
        if (n.additionalProperties !== false) problems.push(`${path}: open object`);
        for (const [k, v] of Object.entries(n.properties ?? {})) walk(v as Node, `${path}.${k}`);
        break;
      default:
        problems.push(`${path}: type ${n.type} not allowed`);
    }
  };
  if (root.oneOf) root.oneOf.forEach((b: Node, i: number) => walk(b, `${label}[${i}]`));
  else walk(root, label);
  return problems;
}

describe("guard 1: schemas admit no free text", () => {
  it("scorecard schema is closed", () => expect(auditSchema(scorecardSchema, "scorecard")).toEqual([]));
  it("coach schema is closed and the person owns the action", () => {
    expect(auditSchema(coachSchema, "coach")).toEqual([]);
    expect((coachSchema as Node).properties.action_owner.const).toBe("person");
    for (const f of ["auto_apply", "apply", "fix", "edit", "message", "text", "note", "request"]) {
      expect((coachSchema as Node).properties[f]).toBeUndefined();
    }
  });
});

const GOOD: Record<string, Node> = {
  "deck, full card": {
    ...base, kind: "deliverable", model_vendor: "anthropic", model_release: "anthropic.claude-opus-5-5",
    deliverable_type: "deck", audience: "partner", length_band: "1000_to_3000", brief_used: true,
    skills_used: ["voice", "brand", "fact_check"], pass_count: 23, catches_me: 11, catches_tool: 7,
    catches_standard: 5, standard_kind: "published_guide",
    voice_flags_found: { em_dash: 9, hedge: 3 }, voice_flags_remaining: { em_dash: 0, hedge: 0 },
    fact_pass: "pass", facts_checked: 14, facts_corrected: 2, sources_opened: 14, three_minute_test: "passed",
    brand_check: { claims: "pass", names: "pass", voice: "pass", visuals: "fail" }, released_after_check: true,
    receipt: { agent: "grader", files_read: 6, files_written: 1, network_attempts: 0, content_transmitted: false, boundary_events: 0 },
  },
  "almost everything withheld": { ...base, kind: "deliverable" },
  "worksheet done": { ...base, kind: "worksheet", worksheet_id: "A1", status: "completed", skill_version: 1, check_step_done: true },
};

const BAD: Record<string, Node> = {
  "free-text note": { ...base, kind: "deliverable", note: "Q3 pitch to Acme" },
  "skill by name": { ...base, kind: "skill_retest", skill_slot: "acme-pitch-voice", skill_version: 2 },
  "made-up model": { ...base, kind: "deliverable", model_release: "my secret model" },
  "count as a channel": { ...base, kind: "deliverable", pass_count: 99999 },
  "fractional count": { ...base, kind: "deliverable", pass_count: 23.5 },
  "date with text": { ...base, kind: "deliverable", graded_on: "2026-10-18 acme" },
  "future date": { ...base, kind: "deliverable", graded_on: "2027-03-01" },
  "receipt with file names": { ...base, kind: "deliverable", receipt: { agent: "grader", files: ["acme-deck.md"] } },
  "receipt from the coach": { ...base, kind: "deliverable", receipt: { agent: "coach", files_read: 1 } },
  "corrected more than checked": { ...base, kind: "deliverable", facts_checked: 2, facts_corrected: 5 },
};

describe("guard 1: sample cards", () => {
  it("no audience hints at a person's situation: investor folded into partner (Mark, Oct 30)", () => {
    const card = { ...GOOD[Object.keys(GOOD).find((k) => (GOOD as Record<string, { audience?: string }>)[k].audience)!], audience: "investor" };
    expect(checkCard(card, today).ok).toBe(false);
  });
  for (const [name, card] of Object.entries(GOOD)) it(`accepts: ${name}`, () => expect(checkCard(card, today).ok).toBe(true));
  for (const [name, card] of Object.entries(BAD)) it(`rejects: ${name}`, () => expect(checkCard(card, today).ok).toBe(false));
  it("rejects a coach that offers to fix things", () => {
    const rec = { schema_version: "1.0", issued_on: "2026-10-18", kind: "retest_skill", reason: "stale_since_release", action_owner: "person" };
    expect(validateCoachRecommendation(rec)).toBe(true);
    expect(validateCoachRecommendation({ ...rec, auto_apply: true })).toBe(false);
    expect(validateCoachRecommendation({ ...rec, message: "Paste your draft" })).toBe(false);
    expect(validateCoachRecommendation({ ...rec, action_owner: "coach" })).toBe(false);
  });
});
