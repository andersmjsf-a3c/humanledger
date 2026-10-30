import data from "./generated/service.json";
import type { DoPage, GlossaryTerm } from "./types";
import type { Starter } from "@/starters/fill";

export const DO_PAGES = data.pages as DoPage[];
export const GLOSSARY = data.glossary as GlossaryTerm[];
export const STARTERS = data.starters as Starter[];
export const starterById = (id: string) => STARTERS.find((s) => s.id === id);
export const TILES = data.tiles as { n: number; title: string; covers: string }[];
export const pageBySlug = (s: string) => DO_PAGES.find((p) => p.slug === s);
export const termBySlug = (s: string) => GLOSSARY.find((t) => t.slug === s);

// Workbook codes the Keep this button can open, and where each lives on the site.
// Worksheets 0.x, A, B, and C5 are pages; C2 is the skill builder's agent template. Codes not here aren't built yet.
export const FORM_ROUTES: Record<string, { href: string; label: string }> = {
  "0.4": { href: "/workbook/0.4", label: "Projects and memory (0.4)" },
  "0.7": { href: "/workbook/0.7", label: "Models and platform changes (0.7)" },
  A1: { href: "/workbook/A1", label: "The paragraph about you (A1)" },
  A2: { href: "/workbook/A2", label: "Your brief, every time (A2)" },
  A3: { href: "/workbook/A3", label: "How you want it to talk to you (A3)" },
  A4: { href: "/workbook/A4", label: "Your corrections log (A4)" },
  A5: { href: "/workbook/A5", label: "Your trust rules (A5)" },
  B1: { href: "/workbook/B1", label: "Your first skill (B1)" },
  B2: { href: "/workbook/B2", label: "Your writing voice (B2)" },
  B3: { href: "/workbook/B3", label: "Who you are, your brand (B3)" },
  B4: { href: "/workbook/B4", label: "Research and cite (B4)" },
  B5: { href: "/workbook/B5", label: "Your fact-check pass (B5)" },
  B6: { href: "/workbook/B6", label: "Your post skill (B6)" },
  C2: { href: "/skills/7-agent-job-description", label: "Your first agent's job description (C2)" },
  C5: { href: "/workbook/C5", label: "Log one piece of work, pass by pass (C5)" },
};
