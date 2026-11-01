// Homepage v3 (Oct 31 2026): reference cards come from the dated JSON, and until the encrypted vault
// ships the page makes none of the claims that describe it.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { BELOW, CHANGED_CARD, EVERYTHING_YOURS, VAULT_LIVE, WHERE_CARD, shortWhere } from "@/service/home";
import { WHERE, CHANGES } from "@/service/reference";

describe("homepage v3", () => {
  it("Where things live rows are the JSON's own sentences, never cut mid-sentence", () => {
    expect(WHERE_CARD.rows.length).toBe(5);
    for (const r of WHERE_CARD.rows) {
      const src = WHERE.rows.find((x) => x.id === r.id)!.whereToday;
      expect(src.startsWith(r.value), r.id).toBe(true);
      expect(r.value).toMatch(/[.!?]"?$/);
    }
    expect(shortWhere('Customize > Skills. Package it as a ZIP; the folder must contain a skill.md file and more words here.')).toContain("skill.md file");
    expect(WHERE_CARD.rows.find((r) => r.id === "memory-toggle")!.value).toMatch(/Your Claude.*Memory/);
  });

  it("What changed shows the four newest entries from the JSON", () => {
    expect(CHANGED_CARD.map((e) => e.title)).toEqual(CHANGES.slice(0, 4).map((e) => e.title));
  });

  it("with the vault switch off, nothing claims the vault or the connector exists", () => {
    expect(VAULT_LIVE).toBe(false);
    const text = JSON.stringify(BELOW) + EVERYTHING_YOURS;
    for (const claim of [/sealed/i, /stored with us/i, /passkey/i, /recovery code/i, /connector/i, /lost laptop/i, /how many files/i, /deleting your account/i]) {
      expect(text, String(claim)).not.toMatch(claim);
    }
  });

  it("the page carries no banned word and no em dash", () => {
    const page = readFileSync("app/page.tsx", "utf8") + readFileSync("src/service/home.ts", "utf8");
    const copy = page.replace(/\/\/.*$/gm, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
    expect(copy).not.toMatch(/[—–]/);
    expect(copy).not.toMatch(/\b(scorecard|dashboard|ledger|Humanledger|listen|hear)\b/i);
  });
});

// Mark, Oct 31: the unit is a keep. "Skill" may appear in copy only in the gloss ("Claude calls them
// skills"), in upload steps ("Customize > Skills"), in what you type to Claude, and in file names.
describe("the unit is a keep", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : e.name.endsWith(".tsx") ? [`${dir}/${e.name}`] : []));
  const CODE = /import |className=|href=|\/skills|\.skill\b|skill:|SKILL|kind ===|"skill"|skill_|SkillList|SkillBuilder|skillfile|templateById|function Skills\(|"\d-[\w-]*skill"|^\s*(\/\/|\*|\{\/\*)/;
  const ALLOWED = /Claude calls them skills|Customize &gt; Skills|Customize > Skills|re-test my voice|Claude&apos;s word|Download SKILL\.md/;

  it("no stray 'skill' in what a person reads", () => {
    const stray: string[] = [];
    for (const f of [...walk("app"), ...walk("src").filter((x) => !x.includes("generated"))]) {
      readFileSync(f, "utf8").split("\n").forEach((line, i) => {
        if (/\bskills?\b/i.test(line) && !CODE.test(line) && !ALLOWED.test(line)) stray.push(`${f}:${i + 1}: ${line.trim()}`);
      });
    }
    expect(stray).toEqual([]);
  });
});
