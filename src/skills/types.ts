// Starter-skill templates come from the workbook skill's assets/ (the .skill file is the master).
// Every [bracket] in a template is something the reader fills in.

export type TemplateFieldKind = "short" | "long" | "inline";

export interface TemplateField {
  key: string; // "shared.your-name" is filled once and used by every template
  hint: string; // the bracket text, shown as the placeholder
  label: string; // what the field is called on the page
  kind: TemplateFieldKind;
  section: string;
}

export interface SkillTemplate {
  id: string; // file stem, e.g. "2-writing-voice"
  slug: string; // "writing-voice"
  order: number;
  kind: "skill" | "agent";
  title: string; // the H1 text, brackets included
  text: string; // the template, unchanged
  placeholders: string[]; // field key for each [bracket], in order of appearance
  fields: TemplateField[]; // unique fields, in order of first appearance
  source: string;
}

export type SkillAnswers = Record<string, string>;
