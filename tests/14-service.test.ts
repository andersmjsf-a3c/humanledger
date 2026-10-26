// Rings 1 and 2: the content front end. Comes from the human-led-service skill, unchanged; carries
// no founder stories; every Keep this opens a form that exists.
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { buildService } from "../scripts/build-service";
import { DO_PAGES, FORM_ROUTES, GLOSSARY, TILES, termBySlug } from "@/service";
import { fillPrompt } from "@/service/keep";
import { promptParts } from "@/service/parse";
import { whereIsChecked } from "@/service/reference";
import { WORKSHEETS } from "@/worksheets";
import { TEMPLATES } from "@/skills";
import data from "@/service/generated/service.json";

// Named entities from the book and Mark's work. Public standards may be named; these may not.
const BANNED = /\bMark('s| Anderson)\b|Vorixs|CyberProtonics|\bA3C\b|a3c\.one|GrowRight|Growth Brief|Logitech|\bRAPT\b|Afero|Jamboard|HyperKey|Alliance Foundry|\bSidecar\b/;
const DASHES = /[–—]/;
const NOT_BUILT_YET = new Set(["C5"]);

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

  it("worksheet pages no longer show the founder's example", () => {
    expect(readFileSync("src/vault/ui/WorksheetForm.tsx", "utf8")).not.toMatch(/exampleHtml|Mark's example/);
  });
});

describe("reference pages show nothing undated", () => {
  it("Where things live counts as checked only with a date and every row filled", () => {
    expect(whereIsChecked({ lastChecked: null, rows: [{ label: "x", where: "y" }] })).toBe(false);
    expect(whereIsChecked({ lastChecked: "2026-10-26", rows: [{ label: "x", where: null }] })).toBe(false);
    expect(whereIsChecked({ lastChecked: "2026-10-26", rows: [{ label: "x", where: "Settings" }] })).toBe(true);
  });
});
