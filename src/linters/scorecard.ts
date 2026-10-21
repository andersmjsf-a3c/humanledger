// What a linter run can put on a scorecard: counts by category, nothing else. Category names are
// the closed lists in scorecard.schema.json (voice_flags_found, ai_tell_flags_found).
import type { Flag } from "./types";

const AI_TELL: Record<string, string> = {
  "stock lines": "stock_phrase",
  "stiff correspondence": "stock_phrase",
  "significance puffery": "inflated_word",
  "promo puffery": "inflated_word",
  "ai vocabulary": "inflated_word",
  "copula avoidance (say is/has)": "inflated_word",
  "canned notability": "inflated_word",
  "stiff word swaps": "inflated_word",
  "rule of three": "rule_of_three",
  "negative parallelism (not x, it's y)": "negative_parallelism",
  "not only... but also": "negative_parallelism",
  "no x, no y, just z": "negative_parallelism",
  "'y rather than x'": "negative_parallelism",
  "sentence monotony": "uniform_rhythm",
  "few short sentences": "uniform_rhythm",
  "challenges formula": "generic_closer",
};

const clamp = (n: number) => Math.max(0, Math.min(1000, Math.round(n)));

export function aiTellCounts(flags: Flag[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of flags.filter((f) => f.group !== "style")) {
    const k = AI_TELL[f.category.toLowerCase()] ?? "tell_other";
    out[k] = clamp((out[k] ?? 0) + f.count);
  }
  return out;
}

export function voiceCounts(flags: Flag[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const f of flags.filter((f) => f.group !== "style")) {
    const k = f.items.some((i) => i.text.includes("—")) ? "em_dash" : f.group === "hard" ? "banned_word" : "off_voice_other";
    out[k] = clamp((out[k] ?? 0) + f.count);
  }
  return out;
}
