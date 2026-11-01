// Ring 1 reference data, checked against the help center and dated (content/service/*.json, from the
// human-led-service skill's references/data). Nothing shows as current unless it carries a date:
// a dated page that goes stale is worse than none (concept, Oct 26 2026).
import where from "../../content/service/where-things-live.json";
import changes from "../../content/service/what-changed.json";

export interface WhereRow {
  id: string;
  thing: string;
  whereToday: string;
  wasCalled?: string;
  plans?: string;
  source?: string;
  lastChanged?: string;
}
export interface Where { lastChecked: string | null; checkedAgainst?: string; intro?: string; rows: WhereRow[] }
export interface Change { id: string; date: string; title: string; whatChanged: string; whatItLoosens?: string; reTest?: string; source?: string }
export interface Changes { lastChecked?: string; intro?: string; entries: Change[] }

export const WHERE = where as Where;
export const CHANGES = ((changes as Changes).entries ?? []).slice().sort((a, b) => b.date.localeCompare(a.date));
export const CHANGES_INTRO = (changes as Changes).intro;

export const whereIsChecked = (w: Where = WHERE) => !!w.lastChecked && w.rows.length > 0 && w.rows.every((r) => !!r.whereToday);

// The homepage panel's five rows (Oct 26 mockup), in the shortest form: the first sentence.
export const HOME_ROWS: { id: string; label: string }[] = [
  { id: "memory-toggle", label: "Turn memory on or off" },
  { id: "skills-upload", label: "Add a keep to Claude" },
  { id: "web-search", label: "Web search toggle" },
  { id: "model-selector", label: "Which model you're talking to" },
  { id: "retired-cowork", label: "Names that no longer appear" },
];
export const firstSentence = (s: string) => {
  const m = s.match(/^.*?[.;](?=\s|$)/);
  return (m ? m[0] : s).replace(/[.;]$/, "");
};
export const rowById = (id: string) => WHERE.rows.find((r) => r.id === id);
