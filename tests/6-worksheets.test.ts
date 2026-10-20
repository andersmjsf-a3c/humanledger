import { describe, it, expect } from "vitest";
import { WORKSHEETS } from "@/worksheets";
import { renderMarkdown, fileNameFor } from "@/worksheets/render";
import scorecardSchema from "@/schemas/scorecard.schema.json";

const schemaIds: string[] = (scorecardSchema as any).$defs.worksheet.properties.worksheet_id.enum;

describe("worksheet definitions", () => {
  it("Part 0 has all seven worksheets, in order", () => {
    expect(WORKSHEETS.filter((w) => w.part === "0").map((w) => w.id)).toEqual(["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7"]);
  });

  it("every worksheet id is a category the scorecard accepts", () => {
    for (const w of WORKSHEETS) expect(schemaIds).toContain(w.id);
  });

  it("ids, slugs, and prompt ids are unique; tables have rows and columns", () => {
    expect(new Set(WORKSHEETS.map((w) => w.id)).size).toBe(WORKSHEETS.length);
    expect(new Set(WORKSHEETS.map((w) => w.slug)).size).toBe(WORKSHEETS.length);
    for (const w of WORKSHEETS) {
      expect(new Set(w.prompts.map((p) => p.id)).size).toBe(w.prompts.length);
      for (const p of w.prompts.filter((p) => p.kind === "table")) {
        expect(p.rows?.length).toBeGreaterThan(0);
        expect(p.columns?.length).toBeGreaterThan(0);
      }
    }
  });

  it("Mark's examples are real or bracketed, never invented placeholder prose", () => {
    for (const w of WORKSHEETS.filter((w) => w.draft)) expect(w.example).toMatch(/^\[MARK: /);
  });

  it("no em dashes anywhere in worksheet text", () => {
    expect(JSON.stringify(WORKSHEETS)).not.toContain("—");
  });
});

describe("the Markdown file the person keeps", () => {
  const ws = WORKSHEETS.find((w) => w.id === "0.6")!;
  const md = renderMarkdown(ws, { checked_on: "2026-10-20", "settings.0.0": "On | always", "settings.0.1": "facts change" }, "2026-10-20");

  it("has the title, the answers, and an escaped table", () => {
    expect(md).toContain("# 0.6. Five settings worth knowing");
    expect(md).toContain("2026-10-20");
    expect(md).toContain("| Web search | On \\| always | facts change |");
  });

  it("marks unanswered prompts plainly", () => {
    expect(renderMarkdown(WORKSHEETS[0], {}, "2026-10-20")).toContain("_(not answered yet)_");
  });

  it("files land in a worksheets folder", () => {
    expect(fileNameFor(ws)).toBe("worksheets/0.6-five-settings.md");
  });
});
