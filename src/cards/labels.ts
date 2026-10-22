// Plain words for every scorecard field and value, so the person reads exactly what would go.
// The words live in labels.json, which the grading skill's preview script reads too, so the
// preview in Claude and the review page on the site say the same thing.
// tests/11-cards.test.ts checks every field in scorecard.schema.json has a label.
import type { Card } from "./build";
import labels from "./labels.json";

export const FIELD_LABELS: Record<string, string> = labels.fields;
const VALUE_LABELS: Record<string, string> = labels.values;
const SUBFIELD_LABELS: Record<string, string> = labels.subfields;
const COUNT_FIELDS = new Set(labels.countFields);

const value = (v: unknown, field = ""): string => {
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v.toLocaleString("en-US");
  if (typeof v === "string") return VALUE_LABELS[v] ?? v.replace(/_/g, " ");
  if (Array.isArray(v)) return v.map((x) => value(x)).join(", ") || "None";
  if (v && typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>);
    const parts = COUNT_FIELDS.has(field)
      ? entries.map(([k, x]) => `${value(x)} ${VALUE_LABELS[k] ?? k.replace(/_/g, " ")}`)
      : entries.map(([k, x]) => `${SUBFIELD_LABELS[k] ?? k.replace(/_/g, " ")}: ${value(x)}`);
    return parts.join(", ") || "None";
  }
  return String(v);
};

// Always in the schema's own order, whatever order the stored JSON comes back in.
const ORDER = Object.keys(FIELD_LABELS);
const rank = (k: string) => ORDER.indexOf(k) + 1 || ORDER.length + 1;

export function rows(card: Card): { key: string; label: string; value: string }[] {
  return Object.entries(card)
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([k, v]) => ({ key: k, label: FIELD_LABELS[k] ?? k, value: value(v, k) }));
}

// Things on a grader's receipt the person should look at before sending. Never blocks sending.
export function receiptWarnings(card: Card): string[] {
  const r = card.receipt as Record<string, unknown> | undefined;
  if (!r) return [];
  const out: string[] = [];
  if (Number(r.network_attempts) > 0) out.push(`The grader reports ${r.network_attempts} network attempt${r.network_attempts === 1 ? "" : "s"}. It should have none.`);
  if (r.content_transmitted === true) out.push("The grader reports that content left your conversation. It never should.");
  if (Number(r.boundary_events) > 0) out.push(`The grader was asked to do something outside its job ${r.boundary_events} time${r.boundary_events === 1 ? "" : "s"}, and says it didn't.`);
  return out;
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
