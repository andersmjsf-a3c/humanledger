// v2 (Oct 30 2026): starters first. Six skills already written; three questions, then a file.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { STARTERS } from "@/service";
import { fillParts, fillStarter, listHints, missing, optional, type Starter, type StarterAnswers } from "@/starters/fill";
import { buildBundle, bumpVersions, parseBundle, starterAnswersOf, flatStarterAnswers } from "@/vault/bundle";
import { buildDashboard } from "@/dashboard/model";
import { WORKSHEETS } from "@/worksheets";

const BANNED = /\bMark('s| Anderson)\b|Vorixs|CyberProtonics|\bA3C\b|a3c\.one|GrowRight|Growth Brief|Logitech|\bRAPT\b|Afero|Jamboard|HyperKey|Alliance Foundry/;

// Answers taken from each question's own hint, as a reader following the examples would write.
const sample = (s: Starter): StarterAnswers =>
  Object.fromEntries(s.questions.map((q) => [q.key, q.type === "list3" ? listHints(q.hint) : (q.hint.match(/"([^"]+)"/)?.[1] ?? q.hint)]));

describe("the six starters", () => {
  it("six of them, each with exactly three questions: never more than three before a file exists", () => {
    expect(STARTERS).toHaveLength(6);
    for (const s of STARTERS) {
      expect(s.questions, s.id).toHaveLength(3);
      for (const q of s.questions) expect(["text", "list3"], `${s.id}.${q.key}`).toContain(q.type);
    }
  });

  it("every placeholder is a question and every question is used; the file is a valid skill", () => {
    for (const s of STARTERS) {
      const used = new Set([...s.template.matchAll(/\{\{([\w.]+)\}\}/g)].map((m) => m[1].split(".")[0]));
      expect([...used].sort(), s.id).toEqual(s.questions.map((q) => q.key).sort());
      for (const q of s.questions.filter((q) => q.type === "list3"))
        for (const i of [1, 2, 3]) expect(s.template, `${s.id} ${q.key}.${i}`).toContain(`{{${q.key}.${i}}}`);
      expect(s.template).toMatch(new RegExp(`^---\\nname: ${s.id}\\ndescription: .+\\n---\\n`));
      expect(s.template).toMatch(/^## Corrections/m);
      expect(WORKSHEETS.map((w) => w.id), `${s.id} worksheetV2`).toContain(s.worksheetV2);
    }
  });

  it("filled from the examples, every file is complete: no placeholders left, no doubled periods", () => {
    for (const s of STARTERS) {
      const out = fillStarter(s, sample(s));
      expect(out, s.id).not.toMatch(/\{\{|(?<!\.)\.\.(?!\.)/);
      const answers = fillParts(s, sample(s)).filter((p) => "answer" in p);
      expect(answers.length, s.id).toBeGreaterThanOrEqual(3);
    }
  });

  it("a three-item answer becomes three bullet lines", () => {
    const s = STARTERS.find((x) => x.id === "write-like-me")!;
    const out = fillStarter(s, { who: "Consultant", reader: "Owners", never: ["Leverage", "Circle back", "Synergy"] });
    expect(out).toMatch(/^- Leverage\n- Circle back\n- Synergy$/m);
  });

  it("only a question that says it can be left blank is optional, and a blank reads as none yet", () => {
    const s = STARTERS.find((x) => x.id === "check-the-facts")!;
    expect(s.questions.filter(optional).map((q) => q.key)).toEqual(["burned"]);
    expect(missing(s, { kinds: "Memos", cost: "A client", burned: "" })).toEqual([]);
    expect(fillStarter(s, { kinds: "Memos", cost: "A client", burned: "" })).toContain("before: (none yet)");
    expect(missing(s, { kinds: "", cost: "A client", burned: "" })).toEqual(["kinds"]);
  });

  it("starter text carries no founder names and no em dashes", () => {
    for (const f of ["content/service/v2/starters/starters.json", ...STARTERS.map((s) => `content/service/v2/starters/${s.file}`), "app/page.tsx", "app/why/page.tsx"]) {
      const t = readFileSync(f, "utf8");
      expect(t.match(BANNED)?.[0], f).toBeUndefined();
      expect(/[–—]/.test(t), f).toBe(false);
    }
  });

  it("the two pictures are plain SVG: no scripts, no outside requests", () => {
    for (const f of ["public/illustrations/how-it-works.svg", "public/illustrations/a-skill-file.svg"]) {
      const t = readFileSync(f, "utf8");
      expect(t).not.toMatch(/<script|<foreignObject|xlink:href="http|href="http|@import|url\(http/i);
    }
  });
});

describe("a kept starter lives in the vault like any skill", () => {
  const s = STARTERS.find((x) => x.id === "write-like-me")!;
  const answers = { who: "Consultant", reader: "Owners", never: ["Leverage", "Circle back", "Synergy"] };
  const rec = { id: "starter:write-like-me", answers: flatStarterAnswers(answers), updatedAt: "2026-10-30T10:00:00Z", version: 1 };

  it("folder save writes its SKILL.md, and the answers file brings it back", () => {
    const files = buildBundle([rec], new Date("2026-10-30T12:00:00Z"));
    expect(files["skills/write-like-me/SKILL.md"]).toBe(fillStarter(s, answers));
    const back = parseBundle(files[".workbook/answers.json"]);
    expect(back.records).toEqual([{ ...rec, savedToFolderAt: rec.updatedAt }]);
    expect(starterAnswersOf(s, back.records[0].answers)).toEqual(answers);
  });

  it("a changed answer bumps the version on the next save or download", () => {
    const [first] = bumpVersions([rec]);
    expect(first.version).toBe(2);
    expect(bumpVersions([first])).toEqual([]);
  });

  it("the dashboard counts it: the voice card is Kept, and a starter with no card still counts as a file", () => {
    const d = buildDashboard({
      now: new Date("2026-10-30T12:00:00Z"),
      files: [
        { id: "starter:write-like-me", filled: true, updatedAt: "2026-10-30T10:00:00Z", version: 1 },
        { id: "starter:my-posts", filled: true, updatedAt: "2026-10-30T10:00:00Z", version: 1 },
      ],
      tried: {},
      runs: [],
      cards: [],
      releases: [],
    });
    const voice = d.cards.find((c) => c.cap.key === "voice")!;
    expect([voice.state, voice.action.label, voice.action.href]).toEqual(["kept", "Export to Claude", "/start/write-like-me"]);
    expect(d.top.filesKept).toBe(2);
  });
});
