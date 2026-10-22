import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { lintBaseline } from "@/linters/baseline";
import rules from "@/linters/baseline-rules.json";

const expected: Record<string, { hard: string[]; tells: string[] }> = JSON.parse(readFileSync("tests/fixtures/linter-expected.json", "utf8"));

describe("baseline linter: a faithful port of the generic parts of ai_tells.py", () => {
  for (const file of readdirSync("tests/fixtures/linter").filter((f) => f.endsWith(".md")).sort()) {
    it(`matches the original, line for line: ${file}`, () => {
      const text = readFileSync(`tests/fixtures/linter/${file}`, "utf8");
      const r = lintBaseline(text, { email: file.includes("email") });
      expect({
        hard: r.flags.filter((f) => f.group === "hard").map((f) => f.label),
        tells: r.flags.filter((f) => f.group === "tells").map((f) => f.label),
      }).toEqual(expected[file]);
    });
  }

  it("leaves Mark's house style out: no hedges, honesty framing, intensifiers, dash rules, or exclamation points", () => {
    expect(Object.keys(rules)).not.toContain("STYLE");
    expect(Object.keys(rules.PATTERNS)).not.toContain("exclamation");
    const r = lintBaseline("Honestly, this is perhaps truly exciting — and frankly -- it works! To be honest.");
    expect(r.flags).toEqual([]);
  });

  it("exclamation points are a rule the reader can choose, not a baseline flag", () => {
    expect(lintBaseline("We shipped it!").flags).toEqual([]);
    const mine = lintVoice("We shipped it!", rulesFrom([{ source: "A3 · Punctuation or style", text: "No exclamation points" }]));
    expect(mine.flags.map((f) => [f.label, f.source])).toEqual([["exclamation points x1 (your rule: No exclamation points)", "A3 · Punctuation or style"]]);
  });

  it("flags are pointers, with the phrases that matched, never replacements", () => {
    const r = lintBaseline("This serves as a testament to our robust approach.");
    const puff = r.flags.find((f) => f.category === "significance puffery")!;
    expect(puff.items.map((i) => i.text)).toEqual(["a testament to", "serves as"]);
    expect(JSON.stringify(r)).not.toMatch(/replace|instead use|suggest/i);
  });
});

import { lintVoice, rulesFrom } from "@/linters/voice";
import { collectSources, RULE_SOURCES } from "@/linters/sources";
import { aiTellCounts, voiceCounts } from "@/linters/scorecard";
import { worksheetById } from "@/worksheets";
import { fieldsOf } from "@/worksheets/types";
import { templateById } from "@/skills";
import { checkCard } from "@/lib/scorecard/validate";
import { IDBFactory } from "fake-indexeddb";
import { AnswerStore } from "@/vault/storage";

describe("voice linter: the reader's own rules, nobody else's", () => {
  const records = {
    "skill:2-writing-voice": {
      "words-and-phrases-i-never-use.list-them-start-with-any-you-ve-caught-the-ai-us": "leverage\ndelve, synergy",
      "rules.punctuation-rules-e-g-no-em-dashes-no-exclamatio": "No em dashes. No exclamation points.",
    },
    A3: { "never-say": "Never say \"circle back\"", length: "Under 120 words unless I ask", format: "Lead with the recommendation" },
    A4: { "fill-in-the-first-five.item-1": "Opened with 'Great question' → never open with \"Great question\"" },
  };
  const rules = rulesFrom(collectSources(records));
  const draft = "Great question! We should leverage this — and circle back. Let's delve in. Let's delve deeper.";
  const r = lintVoice(draft, rules);
  const by = (g: string) => r.flags.filter((f) => f.group === g);

  it("turns never-lines into phrases and patterns, and names where each rule came from", () => {
    const hard = by("hard").map((f) => [f.label, f.source]);
    expect(hard).toEqual(expect.arrayContaining([
      ['"leverage" x1 (your rule: leverage)', "Writing-voice skill · Words I never use"],
      ['"delve" x2 (your rule: delve)', "Writing-voice skill · Words I never use"],
      ["em dashes x1 (your rule: No em dashes.)", "Writing-voice skill · Rules"],
      ["exclamation points x1 (your rule: No exclamation points.)", "Writing-voice skill · Rules"],
      ['"circle back" x1 (your rule: Never say "circle back")', "A3 · Never say"],
      ['"Great question" x1 (your rule: never open with "Great question")', "A4 · Corrections log · row 1"],
    ]));
    expect(hard.find(([l]) => l?.includes("synergy"))).toBeUndefined();
  });

  it("checks a word limit, and lists rules a program can't test as a checklist", () => {
    expect(lintVoice("word ".repeat(150), rules).flags.find((f) => f.group === "tells")?.label).toBe("150 words, over your 120 (your rule: Under 120 words unless I ask)");
    expect(by("style").map((f) => f.category)).toContain("Lead with the recommendation");
  });

  it("with no rules written, there's nothing to run, so nothing of anyone else's is applied", () => {
    expect(rulesFrom(collectSources({}))).toEqual([]);
    expect(lintVoice(draft, []).flags).toEqual([]);
  });

  it("every source key still exists in the workbook drafts and skill templates", () => {
    for (const s of RULE_SOURCES) {
      const keys = s.record.startsWith("skill:") ? templateById(s.record.slice(6))!.fields.map((f) => f.key) : fieldsOf(worksheetById(s.record)!).map((f) => f.key);
      expect(keys.some((k) => k === s.keyPrefix || k.startsWith(s.keyPrefix)), `${s.record} ${s.keyPrefix}`).toBe(true);
    }
  });
});

describe("only counts leave the page, and they fit the scorecard", () => {
  it("a run's counts make a valid scorecard with no text in it", () => {
    const text = readFileSync("tests/fixtures/linter/01-ai-blog.md", "utf8");
    const base = lintBaseline(text);
    const voice = lintVoice(text, rulesFrom([{ source: "A3 · Never say", text: "robust", neverList: true }]));
    const card = {
      kind: "deliverable", schema_version: "1.1", grading_skill_version: "g1.1", graded_on: new Date().toISOString().slice(0, 10),
      ai_tell_flags_found: aiTellCounts(base.flags), voice_flags_found: voiceCounts(voice.flags),
    };
    expect(checkCard(card)).toEqual({ ok: true, card });
    expect(JSON.stringify(card)).not.toMatch(/agents|testament|robust/i);
  });

  it("runs are stored as numbers only", async () => {
    const s = new AnswerStore(new IDBFactory());
    await s.addRun({ at: "2026-10-21T10:00:00Z", words: 92, baseline: { hard: 0, tells: 30 }, voice: { hard: 1, tells: 0, rules: 1 }, aiTellFlags: { inflated_word: 18 }, voiceFlags: { banned_word: 1 } });
    const runs = await s.runs();
    expect(runs).toHaveLength(1);
    const strings = JSON.stringify(runs).match(/"[^"]*"/g)!.filter((x) => !/^"(at|words|baseline|voice|hard|tells|rules|aiTellFlags|voiceFlags|inflated_word|banned_word|2026-10-21T10:00:00Z)"$/.test(x));
    expect(strings).toEqual([]);
  });
});
