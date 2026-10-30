// Rings 1 and 2: the content front end. Comes from the human-led-service skill, unchanged; carries
// no founder stories; every Keep this opens a form that exists.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { buildService } from "../scripts/build-service";
import { DO_PAGES, FORM_ROUTES, GLOSSARY, TILES, termBySlug } from "@/service";
import { fillPrompt } from "@/service/keep";
import { promptParts } from "@/service/parse";
import { CHANGES, HOME_ROWS, WHERE, firstSentence, rowById, whereIsChecked } from "@/service/reference";
import { WORKSHEETS } from "@/worksheets";
import { TEMPLATES } from "@/skills";
import data from "@/service/generated/service.json";

// Named entities from the book and Mark's work. Public standards may be named; these may not.
const BANNED = /\bMark('s| Anderson)\b|Vorixs|CyberProtonics|\bA3C\b|a3c\.one|GrowRight|Growth Brief|Logitech|\bRAPT\b|Afero|Jamboard|HyperKey|Alliance Foundry|\bSidecar\b/;
const DASHES = /[–—]/;
const NOT_BUILT_YET = new Set<string>();

describe("the content comes from the skill, unchanged", () => {
  it("the generated file is current (run `npm run service` after copying in new content)", () => {
    expect(JSON.parse(JSON.stringify(buildService()))).toEqual(data);
  });

  it("eight pages, in tile order, each matching its homepage tile", () => {
    expect(DO_PAGES.map((p) => p.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(TILES.map((t) => t.title)).toEqual(DO_PAGES.map((p) => p.title));
    expect(new Set(DO_PAGES.map((p) => p.slug)).size).toBe(8);
  });

  it("every page has the rule, a prompt to paste, and a Keep this, and labels its illustration", () => {
    for (const p of DO_PAGES) {
      expect(p.ruleHtml.length, p.slug).toBeGreaterThan(200);
      expect(p.tryIt.prompt.length, p.slug).toBeGreaterThan(0);
      expect(p.keepHtml.length, p.slug).toBeGreaterThan(0);
      if (p.persona !== "none") expect(p.sections.map((s) => s.html).join(""), p.slug).toContain("An illustration, not a real person.");
    }
  });

  it("every glossary link on a page goes to a real term", () => {
    for (const p of DO_PAGES) for (const g of p.glossary.filter((g) => g !== "all")) expect(termBySlug(g), `${p.slug} -> ${g}`).toBeDefined();
    expect(GLOSSARY.length).toBeGreaterThan(20);
    expect(GLOSSARY.find((t) => /this book/i.test(t.definitionText))).toBeUndefined();
  });
});

describe("Keep this opens a form that exists", () => {
  it("every code a page names is built, or knowingly not yet", () => {
    for (const p of DO_PAGES) for (const c of p.worksheets) expect(FORM_ROUTES[c] || NOT_BUILT_YET.has(c), `${p.slug} -> ${c}`).toBeTruthy();
  });

  it("every route points at a real worksheet or skill template", () => {
    const real = new Set([...WORKSHEETS.map((w) => `/workbook/${w.id}`), ...TEMPLATES.map((t) => `/skills/${t.id}`)]);
    for (const [code, r] of Object.entries(FORM_ROUTES)) expect(real.has(r.href), code).toBe(true);
  });

  it("what you typed travels; what you left blank stays a visible blank", () => {
    const parts = promptParts("Send [what] to [who] by Friday.");
    expect(fillPrompt(parts, { 1: "the report" })).toBe("Send the report to [who] by Friday.");
  });
});

describe("service copy carries no founder stories and no em dashes", () => {
  const files = [
    ...readdirSync("content/service/do").filter((f) => /^\d+-.*\.md$/.test(f) || f === "homepage-copy.md").map((f) => `content/service/do/${f}`),
    "app/page.tsx",
    "app/why/page.tsx",
    "app/privacy/page.tsx",
    "app/glossary/page.tsx",
    "app/where-things-live/page.tsx",
    "app/what-changed/page.tsx",
    "src/service/SiteChrome.tsx",
    "src/service/KeepThis.tsx",
    "src/service/TryIt.tsx",
  ];
  for (const f of files)
    it(f, () => {
      const text = readFileSync(f, "utf8");
      expect(text.match(BANNED)?.[0]).toBeUndefined();
      expect(DASHES.test(text)).toBe(false);
    });

  it("the glossary as shown", () => {
    const text = GLOSSARY.map((t) => `${t.term} ${t.definitionText}`).join("\n");
    expect(text.match(BANNED)?.[0]).toBeUndefined();
    expect(DASHES.test(text)).toBe(false);
  });

  it("every worksheet is the company-voice version: its example is a labeled illustration, no founder names", () => {
    for (const w of WORKSHEETS) {
      expect(w.exampleHeading, w.id).toBe("An example");
      expect(w.exampleHtml, w.id).toContain("An illustration, not a real person.");
      const text = readFileSync(w.source, "utf8");
      expect(text.match(BANNED)?.[0], w.id).toBeUndefined();
      expect(DASHES.test(text), w.id).toBe(false);
    }
  });
});

describe("reference pages show nothing undated", () => {
  it("Where things live counts as checked only with a date and every row filled", () => {
    expect(whereIsChecked({ lastChecked: null, rows: [{ id: "x", thing: "x", whereToday: "y" }] })).toBe(false);
    expect(whereIsChecked({ lastChecked: "2026-10-26", rows: [{ id: "x", thing: "x", whereToday: "" }] })).toBe(false);
    expect(whereIsChecked({ lastChecked: "2026-10-26", rows: [{ id: "x", thing: "x", whereToday: "Settings" }] })).toBe(true);
  });

  it("the shipped data is dated, sourced, and has every row the homepage panel shows", () => {
    expect(WHERE.lastChecked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(whereIsChecked()).toBe(true);
    for (const h of HOME_ROWS) expect(rowById(h.id), h.id).toBeDefined();
    for (const r of WHERE.rows) expect(r.source, r.id).toMatch(/^https:\/\//);
    expect(CHANGES.length).toBeGreaterThanOrEqual(2);
    for (const c of CHANGES) {
      expect(c.date, c.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(c.reTest, c.id).toBeTruthy();
    }
    const text = JSON.stringify([WHERE, CHANGES]);
    expect(text.match(BANNED)?.[0]).toBeUndefined();
    expect(DASHES.test(text)).toBe(false);
  });

  it("the homepage panel shows the short form of each row", () => {
    expect(firstSentence('Settings > Your Claude. Toggles: memory from chats.')).toBe("Settings > Your Claude");
  });
});
