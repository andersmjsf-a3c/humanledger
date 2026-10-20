// A worksheet is data, not code: adding one is content work. The engine renders the form,
// saves answers on the person's device, and writes a Markdown file they keep.

export type PromptKind = "short" | "long" | "date" | "table";

export interface Prompt {
  id: string;
  label: string;
  help?: string;
  kind: PromptKind;
  expected?: string; // "two sentences", "five rules"
  rows?: string[]; // table prompts: fixed row labels
  columns?: string[]; // table prompts: column headers after the row label
}

export interface Worksheet {
  id: string; // must match the worksheet_id category in scorecard.schema.json
  part: "0" | "A" | "B" | "C";
  slug: string;
  title: string;
  promise: string; // one line: what you'll have and how long it takes
  minutes: number;
  why: string; // Mark's voice; may hold [MARK: ...] until drafted
  example: string; // Mark's real example, or a [MARK: ...] bracket; never invented
  prompts: Prompt[];
  compounds: string;
  draft: boolean; // true until the workbook skill has drafted and Mark has approved the text
}

export type Answers = Record<string, string>; // prompt id (or "promptId.row.col" for tables) -> text
