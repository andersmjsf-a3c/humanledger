// The workbook drafts are the source. These tests fail if the pages drift from them.
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { WORKSHEETS } from "@/worksheets";
import { fieldsOf } from "@/worksheets/types";
import { renderMarkdown, fileNameFor } from "@/worksheets/render";
import { buildAll } from "../scripts/build-worksheets";
import scorecardSchema from "@/schemas/scorecard.schema.json";

const schemaIds: string[] = (scorecardSchema as any).$defs.worksheet.properties.worksheet_id.enum;
const yourTurn = (src: string) => {
  const t = readFileSync(src, "utf8");
  const s = t.slice(t.indexOf("## Your turn"), t.indexOf("## Why this compounds"));
  return s.slice(0, s.search(/^\*How to:/m) >= 0 ? s.search(/^\*How to:/m) : undefined);
};

describe("worksheets come from the drafts, unchanged", () => {
  it("the generated file is current (run `npm run worksheets` after copying in new drafts)", () => {
    expect(JSON.parse(JSON.stringify(buildAll()))).toEqual(WORKSHEETS);
  });

  it("Part 0 has all seven worksheets, in order, with ids the scorecard accepts", () => {
    expect(WORKSHEETS.filter((w) => w.part === "0").map((w) => w.id)).toEqual(["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7"]);
    for (const w of WORKSHEETS) expect(schemaIds).toContain(w.id);
  });

  it("Part A has all five worksheets, in order", () => {
    expect(WORKSHEETS.filter((w) => w.part === "A").map((w) => w.id)).toEqual(["A1", "A2", "A3", "A4", "A5"]);
  });

  it("a numbered list of blanks inside a question becomes one field per line (A5's five rules)", () => {
    const a5 = WORKSHEETS.find((w) => w.id === "A5")!;
    const q2 = a5.yourTurn.find((s) => s.type === "item" && s.n === 2);
    expect(q2 && q2.type === "item" && q2.fields.length).toBe(5);
  });

  it("every blank in every draft becomes exactly one field", () => {
    for (const w of WORKSHEETS) {
      const src = yourTurn(w.source);
      const standalone = (src.match(/^\s*_{3,}\s*$/gm) ?? []).length;
      const bullets = src.split("\n").filter((l) => /^\s*- /.test(l) || /^\s+\d+\.\s/.test(l));
      const bulletBlanks = bullets.reduce((n, l) => n + (l.match(/_{5}/g) ?? []).length + (l.includes("( )") ? 1 : 0), 0);
      const tableBlanks = (src.match(/\|\s*_{3,}\s*\|/g) ?? []).length;
      const fields = fieldsOf(w).filter((f) => f.kind !== "check").length;
      expect({ id: w.id, fields }).toEqual({ id: w.id, fields: standalone + bulletBlanks + tableBlanks });
    }
  });

  it("every numbered question in the draft is on the page, in order", () => {
    for (const w of WORKSHEETS) {
      const numbers = (yourTurn(w.source).match(/^\d+\.\s/gm) ?? []).map((s) => Number(s));
      const items = w.yourTurn.flatMap((s) => (s.type === "item" ? [s.n] : []));
      expect(items).toEqual(numbers);
    }
  });

  it("field keys are unique within a worksheet", () => {
    for (const w of WORKSHEETS) {
      const keys = fieldsOf(w).map((f) => f.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("a worksheet is marked draft exactly when a [MARK: ...] bracket remains", () => {
    for (const w of WORKSHEETS) expect(w.draft).toBe(readFileSync(w.source, "utf8").includes("[MARK:"));
  });

  it("no em dashes", () => {
    expect(JSON.stringify(WORKSHEETS)).not.toContain("—");
  });
});

describe("the Markdown file the person keeps", () => {
  const ws06 = WORKSHEETS.find((w) => w.id === "0.6")!;
  const md = renderMarkdown(ws06, { "setting.web-search": "On | every chat", "which-of-the-five-was-set-differently-from-how-y": "Memory" }, "2026-10-20");

  it("has the title, the fill-in table with escaped answers, and the questions", () => {
    expect(md).toContain("# 0.6. Five settings worth knowing");
    expect(md).toMatch(/\| Web search \|.*\| On \\\| every chat \|/);
    expect(md).toContain("Memory");
  });

  it("marks unanswered questions and unticked steps plainly", () => {
    const ws03 = WORKSHEETS.find((w) => w.id === "0.3")!;
    const out = renderMarkdown(ws03, {}, "2026-10-20");
    expect(out).toContain("_(not answered yet)_");
    expect(out).toContain("_(not done yet)_");
  });

  it("files land in a worksheets folder", () => {
    expect(fileNameFor(ws06)).toBe("worksheets/0.6-five-settings-worth-knowing.md");
  });
});
