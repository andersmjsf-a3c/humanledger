// The workbook skill is the master (Mark, Oct 20 2026). Content arrives only through
// `npm run import:workbook -- <file>.skill`; these tests keep it that way.
import { describe, it, expect, beforeEach } from "vitest";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { zipSync, strToU8 } from "fflate";
import { importSkill } from "../scripts/import-workbook";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const draft = (file: string) => readFileSync(`content/workbook/part0/${file}`, "utf8");
const SKILL_MD = '---\nname: "compounding-ai-workbook"\ndescription: "x"\n---\n';

function skillZip(drafts: Record<string, string>, skillMd = SKILL_MD) {
  const files: Record<string, Uint8Array> = { "compounding-ai-workbook/SKILL.md": strToU8(skillMd) };
  for (const [f, t] of Object.entries(drafts)) files[`compounding-ai-workbook/references/drafts/${f}`] = strToU8(t);
  return zipSync(files);
}

describe("content matches the last imported skill file", () => {
  it("every draft in the repo is byte-for-byte what SOURCE.json recorded", () => {
    const source = JSON.parse(readFileSync("content/workbook/SOURCE.json", "utf8"));
    expect(source.skill).toBe("compounding-ai-workbook");
    const onDisk = readdirSync("content/workbook", { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .flatMap((d) => readdirSync(join("content/workbook", d.name)).map((f) => `${d.name}/${f}`))
      .sort();
    expect(onDisk).toEqual(Object.keys(source.files).sort());
    for (const [p, h] of Object.entries(source.files)) expect(sha(readFileSync(join("content/workbook", p), "utf8"))).toBe(h);
  });
});

describe("importing a new skill file", () => {
  let root: string, gen: string;
  const ws01 = "ws01-your-account-and-the-window.md";
  const ws02 = "ws02-files-in-files-out.md";
  beforeEach(() => {
    const dir = mkdtempSync(join(tmpdir(), "wb-"));
    root = join(dir, "content");
    gen = join(dir, "worksheets.json");
    importSkill(skillZip({ [ws01]: draft(ws01), [ws02]: draft(ws02) }), { contentRoot: root, generatedPath: gen });
  });

  it("a re-import of the same file changes nothing", () => {
    const r = importSkill(skillZip({ [ws01]: draft(ws01), [ws02]: draft(ws02) }), { contentRoot: root, generatedPath: gen });
    expect(r.unchanged.sort()).toEqual(["0.1", "0.2"]);
    expect(r.changed).toEqual([]);
  });

  it("inserting a question never moves anyone's saved answers", () => {
    const inserted = draft(ws02).replace("1. **Attach a document", "1. **A brand-new first step.** Try it. (One line.)\n   _____\n\n2. **Attach a document");
    const r = importSkill(skillZip({ [ws01]: draft(ws01), [ws02]: inserted }), { contentRoot: root, generatedPath: gen });
    expect(r.changed).toEqual([{ id: "0.2", keysRemoved: [], keysAdded: ["a-brand-new-first-step"] }]);
  });

  it("rewording a question is reported, because those saved answers won't carry over", () => {
    const reworded = draft(ws02).replace("**Paste a passage.**", "**Paste three paragraphs.**");
    const r = importSkill(skillZip({ [ws01]: draft(ws01), [ws02]: reworded }), { contentRoot: root, generatedPath: gen });
    expect(r.changed).toEqual([{ id: "0.2", keysRemoved: ["paste-a-passage"], keysAdded: ["paste-three-paragraphs"] }]);
  });

  it("a worksheet dropped from the skill is removed from the site", () => {
    const r = importSkill(skillZip({ [ws01]: draft(ws01) }), { contentRoot: root, generatedPath: gen });
    expect(r.removed).toEqual(["0.2"]);
    expect(existsSync(join(root, "part0", ws02))).toBe(false);
  });

  it("a zip of drafts adds or replaces only its own worksheets", () => {
    const a1 = readFileSync("content/workbook/partA/wsA1-the-paragraph-about-you.md", "utf8");
    const files = { [`drafts/wsA1-the-paragraph-about-you.md`]: strToU8(a1) };
    const r = importSkill(zipSync(files), { contentRoot: root, generatedPath: gen });
    expect(r.source).toBe("drafts");
    expect(r.added).toEqual(["A1"]);
    expect(r.removed).toEqual([]);
    expect(existsSync(join(root, "part0", ws01))).toBe(true);
    expect(existsSync(join(root, "partA", "wsA1-the-paragraph-about-you.md"))).toBe(true);
    const source = JSON.parse(readFileSync(join(root, "SOURCE.json"), "utf8"));
    expect(source.imports.map((i: any) => i.kind)).toEqual(["skill", "drafts"]);
  });

  it("refuses a different skill, and a broken draft, without touching anything", () => {
    const before = readFileSync(gen, "utf8");
    expect(() => importSkill(skillZip({ [ws01]: draft(ws01) }, SKILL_MD.replace("compounding-ai-workbook", "builders-book")), { contentRoot: root, generatedPath: gen })).toThrow();
    expect(() => importSkill(skillZip({ [ws01]: "# not a worksheet\n" }), { contentRoot: root, generatedPath: gen })).toThrow();
    expect(readFileSync(gen, "utf8")).toBe(before);
    expect(existsSync(join(root, "part0", ws02))).toBe(true);
  });
});
