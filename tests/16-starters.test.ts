// v2 (Oct 30 2026): starters first. Six skills already written; three questions, then a file.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { STARTERS } from "@/service";
import { fillParts, fillStarter, isMemoryStarter, listHints, memoryLine, memoryParagraph, missing, optional, splitHint, type Starter, type StarterAnswers } from "@/starters/fill";
import { buildBundle, bumpVersions, parseBundle, starterAnswersOf, flatStarterAnswers } from "@/vault/bundle";
import { buildDashboard } from "@/dashboard/model";
import { FORM_ROUTES } from "@/service";

const BANNED = /\bMark('s| Anderson)\b|Vorixs|CyberProtonics|\bA3C\b|a3c\.one|GrowRight|Growth Brief|Logitech|\bRAPT\b|Afero|Jamboard|HyperKey|Alliance Foundry/;

// Answers taken from each question's own hint, as a reader following the examples would write.
const sample = (s: Starter): StarterAnswers =>
  Object.fromEntries(s.questions.map((q) => [q.key, q.type === "list3" ? listHints(q.hint) : (q.hint.match(/"([^"]+)"/)?.[1] ?? q.hint)]));

describe("the six starters", () => {
  it("eight of them, each with exactly three questions: never more than three before a file exists", () => {
    expect(STARTERS).toHaveLength(8);
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
      expect(FORM_ROUTES[s.worksheetV2], `${s.id} worksheetV2`).toBeDefined();
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

  it("hints split into guidance and examples, so no stray quote marks reach a placeholder", () => {
    expect(splitHint('"Every evening at 8." "Monday and Thursday mornings."')).toEqual({ guidance: "", example: "Every evening at 8. / Monday and Thursday mornings." });
    expect(splitHint('One sentence a customer would use. "Two accountants who answer the phone."')).toEqual({ guidance: "One sentence a customer would use.", example: "Two accountants who answer the phone." });
    for (const s of STARTERS) for (const q of s.questions) expect(splitHint(q.hint).example, `${s.id}.${q.key}`).not.toContain('"');
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

import { existsSync, readdirSync } from "node:fs";
import { SCREENSHOTS } from "@/service/screenshots";
import { WHERE } from "@/service/reference";
import { WORKSHEETS as ALL_WS } from "@/worksheets";
import { TEMPLATES } from "@/skills";

describe("screenshots, placed per captions.md", () => {
  const placements = JSON.parse(readFileSync("content/service/v2/screenshots/placements.json", "utf8"));

  it("only placed, not-held screens are served, and every one has alt text and a caption", () => {
    const served = readdirSync("public/screenshots").sort();
    expect(served).toEqual(placements.screenshots.filter((s: { held?: string }) => !s.held).map((s: { file: string }) => s.file).sort());
    expect(served).toEqual(SCREENSHOTS.map((s) => s.file).sort());
    for (const s of SCREENSHOTS) {
      expect(s.alt.length, s.file).toBeGreaterThan(20);
      expect(s.caption.length, s.file).toBeGreaterThan(10);
      expect(existsSync(`content/service/v2/screenshots/${s.file}`), s.file).toBe(true);
    }
  });

  it("the book-only screens never reach the site (Mark, Oct 30 pm)", () => {
    const served = readdirSync("public/screenshots");
    for (const f of ["07-skill-running-in-a-chat.png", "08-the-check.png", "09-project-page.png", "10a-asking-for-a-skill.png", "10b-a-skill-made-from-a-conversation.png", "11-pushing-back.png", "12-export-control.png", "13a-playbook-correction.png", "13b-the-playbook-fix.png", "17-skill-used-by-name.png", "18-claude-code-pane.png"]) {
      expect(served, f).not.toContain(f);
      expect(placements.screenshots.map((s: { file: string }) => s.file), f).not.toContain(f);
    }
    expect(served).toContain("07-skill-running-in-a-chat-service.png");
    expect(served).toContain("08-the-check-service.png");
  });

  it("About me shows the memory screen, not the skills list", () => {
    const files = (id: string) => SCREENSHOTS.filter((s) => s.starters === "all" || s.starters?.includes(id)).map((s) => s.file);
    expect(files("about-me")).toEqual(["02-memory-settings.png", "15-memory-settings-web.png"]);
    expect(files("who-my-company-is")).toEqual(expect.arrayContaining(["13a-playbook-correction-service.png", "13b-the-playbook-fix-service.png"]));
    expect(files("check-the-facts")).toEqual(expect.arrayContaining(["14a-fact-pass-ask.png", "14b-fact-pass-output.png"]));
    expect(files("my-work-register")).toEqual(expect.arrayContaining(["06-scheduled-task.png", "18-claude-code-pane-service.png"]));
    for (const s of STARTERS.filter((x) => x.id !== "about-me")) expect(files(s.id), s.id).toEqual(expect.arrayContaining(["03-skills-list.png", "16-skills-add-menu.png"]));
    expect(files("write-like-me")).toContain("03-skills-list.png");
  });

  it("starter pages keep exactly the four general screens behind Show me where", () => {
    expect(SCREENSHOTS.filter((s) => s.showMeWhere).map((s) => s.file).sort()).toEqual(
      ["03-skills-list.png", "10a-asking-for-a-skill-service.png", "10b-a-skill-made-from-a-conversation-service.png", "16-skills-add-menu.png"]
    );
  });

  it("every placement points at a page that exists", () => {
    const ws = new Set(ALL_WS.map((w) => w.id));
    const rows = new Set(WHERE.rows.map((r) => r.id));
    const starters = new Set(STARTERS.map((s) => s.id));
    const skills = new Set(TEMPLATES.map((t) => t.id));
    for (const s of placements.screenshots) {
      for (const w of s.worksheets ?? []) expect(ws.has(w), `${s.file} -> ${w}`).toBe(true);
      for (const r of s.where ?? []) expect(rows.has(r), `${s.file} -> ${r}`).toBe(true);
      if (Array.isArray(s.starters)) for (const st of s.starters) expect(starters.has(st), `${s.file} -> ${st}`).toBe(true);
      for (const k of s.skills ?? []) expect(skills.has(k), `${s.file} -> ${k}`).toBe(true);
    }
    expect(/[–—]/.test(JSON.stringify(placements))).toBe(false);
  });
});

describe("About me: a paragraph for memory, not a skill", () => {
  const s = STARTERS.find((x) => x.id === "about-me")!;
  const a: StarterAnswers = {
    who: "Office manager for a twelve-person dental practice, nine years.",
    working_on: "Switching our scheduling software. Hiring a second front-desk person.",
    how: "One recommendation, not a menu. Short.",
  };

  it("is the only memory starter, and its Version 2 is A1", () => {
    expect(STARTERS.filter(isMemoryStarter).map((x) => x.id)).toEqual(["about-me"]);
    expect(s.worksheetV2).toBe("A1");
  });

  it("fills the paragraph and makes the one line to paste", () => {
    const p = memoryParagraph(s, a)!;
    expect(p).toBe(
      "Who I am: Office manager for a twelve-person dental practice, nine years. What I'm working on this quarter: Switching our scheduling software. Hiring a second front-desk person. How I like work done: One recommendation, not a menu. Short."
    );
    expect(memoryLine(p)).toBe(`Remember this about me: ${p}`);
    expect(memoryParagraph(STARTERS.find((x) => x.id === "write-like-me")!, {})).toBeNull();
  });

  it("lowercases a copied capital mid-sentence, but keeps a name", () => {
    const t = { ...s, questions: [{ key: "who", label: "Who", hint: "", type: "text" as const }], template: "## The paragraph\nI'm {{who}}\n" };
    expect(memoryParagraph(t, { who: "Office manager at a practice" })).toBe("I'm office manager at a practice.");
    expect(memoryParagraph(t, { who: "Dana Ruiz, office manager." })).toBe("I'm Dana Ruiz, office manager.");
  });
});

// Mark, Oct 30 evening: one wording for the three-minute test, everywhere. An import of an older
// skill copy (or a stray edit) that brings back an old phrasing fails here.
describe("the three-minute test has one wording", () => {
  const FINAL = "put away the materials and explain your argument, succinctly and convincingly, in three minutes or less";
  const OLD = [/out loud, (with )?no (notes|materials)/i, /for three minutes\b(?! or less)/i, /three minutes, out loud/i, /without (looking at )?the screen\?/i, /for three minutes with no slide/i];
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : /\.(md|json|tsx?)$/.test(e.name) ? [`${dir}/${e.name}`] : []));
  const files = [...walk("content"), ...walk("app"), ...walk("src").filter((f) => !f.includes("/generated/")), "grader/grade-my-work/SKILL.md"];

  it("no old phrasing anywhere the site reads from", () => {
    for (const f of files) {
      const text = readFileSync(f, "utf8");
      if (!/three-minute test/i.test(text)) continue;
      for (const re of OLD) expect(re.test(text), `${f}: ${re}`).toBe(false);
    }
  });

  it("the glossary and A5 carry the final sentence", () => {
    expect(readFileSync("content/service/glossary.md", "utf8")).toContain("Put away the materials and explain your argument, succinctly and convincingly, in three minutes or less.");
    expect(readFileSync("content/workbook/partA/wsA5-your-trust-rules.md", "utf8")).toContain(FINAL);
  });
});
