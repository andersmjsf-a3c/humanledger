import data from "./generated/templates.json";
import type { SkillTemplate } from "./types";

export const TEMPLATES = (data as unknown as SkillTemplate[]).slice().sort((a, b) => a.order - b.order);
export const STARTER_IDS = TEMPLATES.filter((t) => t.kind === "skill").slice(0, 5).map((t) => t.id);

export function templateById(id: string): SkillTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
