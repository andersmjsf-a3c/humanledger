import data from "./generated/service.json";
import type { DoPage, GlossaryTerm } from "./types";

export const DO_PAGES = data.pages as DoPage[];
export const GLOSSARY = data.glossary as GlossaryTerm[];
export const TILES = data.tiles as { n: number; title: string; covers: string }[];
export const pageBySlug = (s: string) => DO_PAGES.find((p) => p.slug === s);
export const termBySlug = (s: string) => GLOSSARY.find((t) => t.slug === s);

// Workbook codes the Keep this button can open, and where each lives on the site.
// B-section worksheets are the skill builder's templates. Codes not here aren't built yet.
export const FORM_ROUTES: Record<string, { href: string; label: string }> = {
  "0.4": { href: "/workbook/0.4", label: "Projects and memory (0.4)" },
  "0.7": { href: "/workbook/0.7", label: "Models and platform changes (0.7)" },
  A1: { href: "/workbook/A1", label: "The paragraph about you (A1)" },
  A2: { href: "/workbook/A2", label: "Your brief, every time (A2)" },
  A3: { href: "/workbook/A3", label: "How you want it to talk to you (A3)" },
  A4: { href: "/workbook/A4", label: "Your corrections log (A4)" },
  A5: { href: "/workbook/A5", label: "Your trust rules (A5)" },
  B1: { href: "/skills/1-weekly-task", label: "Your first skill (B1)" },
  B2: { href: "/skills/2-writing-voice", label: "Your writing voice (B2)" },
  B3: { href: "/skills/3-brand-rules", label: "Who you are, your brand (B3)" },
  B4: { href: "/skills/4-research-and-cite", label: "Research and cite (B4)" },
  B5: { href: "/skills/5-fact-check-pass", label: "Your fact-check pass (B5)" },
  B6: { href: "/skills/6-post-skill", label: "Your post skill (B6)" },
  C2: { href: "/skills/7-agent-job-description", label: "Your first agent's job description (C2)" },
};
