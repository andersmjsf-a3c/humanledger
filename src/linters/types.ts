// A linter report: counts and matched phrases only, computed in the browser. The text it ran on
// never leaves the page; only the counts can go on a scorecard (week 6), and only on the person's click.

export type Group = "hard" | "tells" | "style";

export interface Flag {
  group: Group;
  category: string; // e.g. "significance puffery", or for the voice linter the reader's rule
  count: number;
  items: { text: string; count: number }[]; // what matched, e.g. "serves as" x2
  label: string; // one-line report text (for the baseline, identical to ai_tells.py)
  source?: string; // voice linter: which of the reader's files the rule came from
}

export interface Report {
  flags: Flag[];
  words: number;
}
