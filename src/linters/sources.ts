// Where the voice linter finds the reader's rules. Keys are the stable answer keys from the
// workbook drafts and skill templates; tests/10-linters.test.ts checks each one still exists.
import type { RuleSource } from "./voice";

export const RULE_SOURCES: { record: string; keyPrefix: string; source: string; neverList?: boolean; correction?: boolean }[] = [
  { record: "skill:2-writing-voice", keyPrefix: "words-and-phrases-i-never-use.", source: "Writing-voice keep · Words I never use", neverList: true },
  { record: "skill:2-writing-voice", keyPrefix: "rules.", source: "Writing-voice keep · Rules" },
  { record: "A3", keyPrefix: "never-say", source: "A3 · Never say", neverList: true },
  { record: "A3", keyPrefix: "punctuation-or-style", source: "A3 · Punctuation or style" },
  { record: "A3", keyPrefix: "format", source: "A3 · Format" },
  { record: "A3", keyPrefix: "length", source: "A3 · Length" },
  { record: "A3", keyPrefix: "words", source: "A3 · Words" },
  { record: "A4", keyPrefix: "fill-in-the-first-five.", source: "A4 · Corrections log", correction: true },
];

export function collectSources(records: Record<string, Record<string, string>>): RuleSource[] {
  const out: RuleSource[] = [];
  for (const s of RULE_SOURCES) {
    const answers = records[s.record] ?? {};
    const keys = Object.keys(answers).filter((k) => k === s.keyPrefix || k.startsWith(s.keyPrefix)).sort();
    keys.forEach((k, i) => {
      const text = answers[k]?.trim();
      if (text) out.push({ source: s.correction ? `${s.source} · row ${i + 1}` : s.source, text, neverList: s.neverList, correction: s.correction });
    });
  }
  return out;
}
