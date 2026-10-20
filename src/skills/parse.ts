import { slug } from "@/worksheets/parse";
import type { SkillTemplate, TemplateField, TemplateFieldKind } from "./types";

const BRACKET = /\[([^\]\n]+)\]/g;
const LONG_HINT = /\b(paragraph|paste|samples?|sentences|list them|observations)\b/i;
export const SHARED_NAME = "shared.your-name";

export function parseTemplate(text: string, file: string): SkillTemplate {
  const h1 = text.match(/^# (Skill|Agent): (.+)$/m);
  if (!h1) throw new Error(`${file}: first line must be "# Skill: ..." or "# Agent: ..."`);
  const id = file.replace(/^.*\//, "").replace(/\.md$/, "");
  const order = Number(id.match(/^(\d+)-/)?.[1] ?? 99);

  const placeholders: string[] = [];
  const fields: TemplateField[] = [];
  const seen = new Set<string>();
  let section = "title";

  for (const line of text.split("\n")) {
    const h2 = line.match(/^## (.+)$/);
    if (h2) section = h2[1].trim();
    const whole = /^\s*(?:[-*]|\d+\.)?\s*\[[^\]\n]+\]\s*\.?\s*$/.test(line);
    for (const m of line.matchAll(BRACKET)) {
      const hint = m[1].trim();
      let key = /^your name$/i.test(hint) ? SHARED_NAME : `${slug(section)}.${slug(hint)}`;
      if (key !== SHARED_NAME) while (seen.has(key)) key += "-2";
      placeholders.push(key);
      if (key === SHARED_NAME && seen.has(key)) continue;
      seen.add(key);
      const kind: TemplateFieldKind = whole ? (LONG_HINT.test(hint) ? "long" : "short") : "inline";
      // Label: the words just before the bracket on its line ("Documents: [font]" -> "Documents"), else the hint.
      const before = line.slice(0, m.index).replace(/^\s*(?:[-*]|\d+\.|#+)\s*/, "").replace(/\[[^\]]*\]/g, "").replace(/[\s:,(]+$/, "").trim();
      const onLine = (line.match(BRACKET) ?? []).length;
      const label =
        key === SHARED_NAME ? "Your name"
        : section === "title" || onLine > 1 || !before || /[^A-Za-z ]/.test(before) || before.split(" ").length > 3 ? hint
        : before;
      fields.push({ key, hint, label, kind, section });
    }
  }

  return {
    id,
    slug: id.replace(/^\d+-/, ""),
    order,
    kind: h1[1] === "Agent" ? "agent" : "skill",
    title: h1[2].trim(),
    text,
    placeholders,
    fields,
    source: file,
  };
}
