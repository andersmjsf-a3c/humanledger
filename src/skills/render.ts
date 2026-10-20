import { slug } from "@/worksheets/parse";
import type { SkillAnswers, SkillTemplate } from "./types";

const BRACKET = /\[([^\]\n]+)\]/g;

// Fills a template. Anything left blank keeps its [bracket], so the reader can see what's missing.
// A list item filled with several lines becomes several list items.
export function fillTemplate(t: SkillTemplate, values: SkillAnswers): string {
  let i = 0;
  const out: string[] = [];
  for (const line of t.text.split("\n")) {
    const list = line.match(/^(\s*)([-*]|\d+\.)\s+\[[^\]\n]+\]\s*$/);
    const filled = line.replace(BRACKET, (m) => {
      const v = (values[t.placeholders[i++]] ?? "").trim();
      return v || m;
    });
    if (list && filled !== line && filled.includes("\n")) {
      const [, indent, marker] = list;
      const items = filled.replace(new RegExp(`^${indent}${marker.replace(".", "\\.")}\\s+`), "").split(/\n+/).map((s) => s.replace(/^\s*[-*]\s+/, "").trim()).filter(Boolean);
      items.forEach((item, n) => out.push(`${indent}${/^\d+\.$/.test(marker) ? `${Number(marker) + n}.` : marker} ${item}`));
    } else out.push(filled);
  }
  return out.join("\n");
}

export function blanksLeft(t: SkillTemplate, values: SkillAnswers): number {
  return t.fields.filter((f) => !(values[f.key] ?? "").trim()).length;
}

const clean = (s: string) => s.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();

// A skill name Claude accepts: lowercase letters, numbers, hyphens; 64 max; no reserved words.
export function skillName(t: SkillTemplate, values: SkillAnswers): string {
  const filledTitle = fillTemplate({ ...t, text: t.title, placeholders: t.placeholders.slice(0, (t.title.match(BRACKET) ?? []).length) }, values);
  const fromTitle = filledTitle.includes("[") ? t.slug : slug(filledTitle);
  const name = fromTitle.replace(/claude|anthropic/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 64).replace(/-$/, "");
  return name || t.slug;
}

// The skill's description is its "This skill serves ..." line, which says what it's for and when to use it.
export function skillDescription(t: SkillTemplate, values: SkillAnswers): string {
  const filled = fillTemplate(t, values).split("\n");
  const line = filled.find((l) => /^This (skill|agent) serves/.test(l)) ?? filled.find((l) => l.trim() && !l.startsWith("#")) ?? t.title;
  return clean(line).slice(0, 1024) || t.slug;
}

export interface SkillFile {
  path: string; // where it goes in the person's folder
  zipPath: string; // where it goes inside the upload zip
  content: string;
}

export function skillFile(t: SkillTemplate, values: SkillAnswers): SkillFile {
  const body = fillTemplate(t, values);
  if (t.kind === "agent") {
    const name = skillName(t, values);
    return { path: `agents/${name}.md`, zipPath: `${name}.md`, content: body.endsWith("\n") ? body : body + "\n" };
  }
  const name = skillName(t, values);
  const description = skillDescription(t, values).replace(/"/g, '\\"');
  const content = `---\nname: ${name}\ndescription: "${description}"\n---\n\n${body.trimEnd()}\n`;
  return { path: `skills/${name}/SKILL.md`, zipPath: `${name}/SKILL.md`, content };
}
