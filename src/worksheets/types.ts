// Worksheets come from the workbook's own draft files (content/workbook/**), parsed at build
// time into this shape. The drafts are the source; pages never carry their own copy of the text.

export type FieldKind = "short" | "long" | "check";

export interface Field {
  key: string; // stable answer key, e.g. "q3", "q3.2", "t1.4"
  label?: string; // shown beside the input when a question has several fields
  kind: FieldKind;
}

export type Segment =
  | { type: "md"; html: string } // prose between questions (e.g. "Then two questions:")
  | { type: "item"; n: number; question: string; html: string; expected?: string; fields: Field[] }
  | { type: "table"; id: string; html: string; header: string[]; rows: { cells: string[]; field?: Field }[]; blankCol: number };

export interface Worksheet {
  id: string; // matches the worksheet_id category in scorecard.schema.json
  part: "0" | "A" | "B" | "C";
  slug: string;
  title: string;
  promiseHtml: string;
  promiseText: string;
  minutes?: number;
  whyHtml: string;
  exampleHtml: string;
  yourTurn: Segment[];
  howToHtml?: string; // the dated sidebar of product facts
  compoundsHtml: string;
  draft: boolean; // true while any [MARK: ...] bracket remains
  source: string; // the draft file it came from
}

export type Answers = Record<string, string>;

export function fieldsOf(ws: Worksheet): Field[] {
  return ws.yourTurn.flatMap((s) =>
    s.type === "item" ? s.fields : s.type === "table" ? s.rows.flatMap((r) => (r.field ? [r.field] : [])) : [],
  );
}
