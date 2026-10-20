import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { unzipSync, zipSync, strToU8, strFromU8 } from "fflate";
import { TEMPLATES, STARTER_IDS, templateById } from "@/skills";
import { SHARED_NAME } from "@/skills/parse";
import { fillTemplate, skillFile, skillName, skillDescription, blanksLeft } from "@/skills/render";
import { PREFILL } from "@/skills/prefill";
import { worksheetById } from "@/worksheets";
import { fieldsOf } from "@/worksheets/types";
import { buildBundle, parseBundle, bumpVersions } from "@/vault/bundle";
import { SHARED_ID, SKILL_PREFIX, type StoredWorksheet } from "@/vault/storage";

const NAME_OK = /^[a-z0-9-]{1,64}$/;

describe("templates come from the workbook skill, unchanged", () => {
  it("all seven are here, the first five are the starter skills", () => {
    expect(TEMPLATES.map((t) => t.id)).toEqual([
      "1-weekly-task", "2-writing-voice", "3-brand-rules", "4-research-and-cite", "5-fact-check-pass", "6-post-skill", "7-agent-job-description",
    ]);
    expect(STARTER_IDS).toHaveLength(5);
  });

  it("every [bracket] in every template is a field, and the template text is untouched", () => {
    for (const t of TEMPLATES) {
      const raw = readFileSync(t.source, "utf8");
      expect(t.text).toBe(raw);
      expect(t.placeholders.length).toBe((raw.match(/\[[^\]\n]+\]/g) ?? []).length);
    }
  });

  it("'your name' is one shared field across every template", () => {
    for (const t of TEMPLATES) expect(t.fields.filter((f) => f.key === SHARED_NAME)).toHaveLength(1);
  });
});

describe("filled skills", () => {
  const voice = templateById("2-writing-voice")!;
  const weekly = templateById("1-weekly-task")!;

  it("blank fields keep their brackets", () => {
    expect(fillTemplate(voice, {})).toBe(voice.text);
    expect(blanksLeft(voice, {})).toBe(voice.fields.length);
  });

  it("a list item filled with several lines becomes several items", () => {
    const key = voice.fields.find((f) => f.key.startsWith("words-and-phrases-i-never-use."))!.key;
    const out = fillTemplate(voice, { [key]: "leverage\n- delve\nunlock" });
    expect(out).toContain("## Words and phrases I never use\n- leverage\n- delve\n- unlock\n");
  });

  it("produces a SKILL.md Claude accepts: valid name, description under 1,024, frontmatter first", () => {
    for (const t of TEMPLATES.filter((x) => x.kind === "skill")) {
      for (const values of [{}, { [SHARED_NAME]: "Mark" }] as Record<string, string>[]) {
        const name = skillName(t, values);
        expect(name).toMatch(NAME_OK);
        expect(name).not.toMatch(/claude|anthropic/);
        const d = skillDescription(t, values);
        expect(d.length).toBeGreaterThan(0);
        expect(d.length).toBeLessThanOrEqual(1024);
        expect(d).not.toMatch(/[<>]/);
        const f = skillFile(t, values);
        expect(f.content.startsWith(`---\nname: ${name}\ndescription: "`)).toBe(true);
        expect(f.path).toBe(`skills/${name}/SKILL.md`);
      }
    }
  });

  it("the skill is named after the task once the reader names it, minus reserved words", () => {
    const titleKey = weekly.fields[0].key;
    expect(skillName(weekly, { [titleKey]: "Monday numbers for Claude" })).toBe("monday-numbers-for");
    expect(skillName(weekly, {})).toBe("weekly-task");
  });

  it("the upload zip holds one folder named for the skill, with SKILL.md inside", () => {
    const f = skillFile(voice, { [SHARED_NAME]: "Mark" });
    const zip = unzipSync(zipSync({ [f.zipPath]: strToU8(f.content) }));
    expect(Object.keys(zip)).toEqual(["my-writing-voice/SKILL.md"]);
    expect(strFromU8(zip["my-writing-voice/SKILL.md"])).toContain("This skill serves Mark.");
  });

  it("the agent job description downloads as plain Markdown, not a skill", () => {
    const f = skillFile(templateById("7-agent-job-description")!, {});
    expect(f.path.startsWith("agents/")).toBe(true);
    expect(f.content.startsWith("---")).toBe(false);
  });
});

describe("offers to reuse worksheet answers", () => {
  it("every link points at a worksheet field and a template field that exist", () => {
    for (const p of PREFILL) {
      const ws = worksheetById(p.worksheet);
      expect(ws, p.worksheet).toBeDefined();
      expect(fieldsOf(ws!).map((f) => f.key)).toContain(p.answer);
      expect(templateById(p.template)!.fields.some((f) => f.key.startsWith(p.fieldPrefix))).toBe(true);
    }
  });
});

describe("skills in the person's folder", () => {
  const voiceKey = templateById("2-writing-voice")!.fields.find((f) => f.key.startsWith("rules."))!.key;
  const records: StoredWorksheet[] = [
    { id: SKILL_PREFIX + "2-writing-voice", answers: { [voiceKey]: "No em dashes" }, updatedAt: "2026-10-20T10:00:00Z" },
    { id: SHARED_ID, answers: { [SHARED_NAME]: "Mark" }, updatedAt: "2026-10-20T10:00:00Z" },
    { id: SKILL_PREFIX + "1-weekly-task", answers: {}, updatedAt: "2026-10-20T10:00:00Z" },
  ];

  it("each started skill is saved as skills/<name>/SKILL.md, with the shared name in it", () => {
    const files = buildBundle(records);
    expect(files["skills/my-writing-voice/SKILL.md"]).toContain("This skill serves Mark.");
    expect(files["skills/my-writing-voice/SKILL.md"]).toContain("- No em dashes");
    expect(Object.keys(files).some((k) => k.includes("weekly-task"))).toBe(false);
  });

  it("skills and the shared name round-trip through the answers file, strictly", () => {
    const files = buildBundle(records);
    const json = JSON.parse(files[".workbook/answers.json"]);
    json.skills["2-writing-voice"].answers.sneaky = "x";
    json.skills["9-unknown"] = { answers: { a: "b" } };
    const back = parseBundle(JSON.stringify(json));
    expect(back.records.find((r) => r.id === SKILL_PREFIX + "2-writing-voice")!.answers).toEqual({ [voiceKey]: "No em dashes" });
    expect(back.records.find((r) => r.id === SHARED_ID)!.answers).toEqual({ [SHARED_NAME]: "Mark" });
    expect(back.skipped).toBe(2);
  });

  it("the version goes up only when the skill file actually changed", () => {
    const first = bumpVersions(records);
    expect(first.map((r) => [r.id, r.version])).toEqual([[SKILL_PREFIX + "2-writing-voice", 1]]);
    const after = records.map((r) => first.find((f) => f.id === r.id) ?? r);
    expect(bumpVersions(after)).toEqual([]);
    const edited = after.map((r) => (r.id === SKILL_PREFIX + "2-writing-voice" ? { ...r, answers: { [voiceKey]: "No exclamation points" } } : r));
    expect(bumpVersions(edited)[0].version).toBe(2);
  });
});
