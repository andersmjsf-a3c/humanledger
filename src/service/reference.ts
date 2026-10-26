// Ring 1 reference data that has to be checked against today's screens and dated before it shows.
// Until then each page says so, rather than show a guess: a dated page that goes stale is worse
// than none (concept, Oct 26 2026). Fill content/service/where-things-live.json and what-changed.json.
import where from "../../content/service/where-things-live.json";
import changes from "../../content/service/what-changed.json";

export interface WhereRow { label: string; where: string | null; was?: string }
export interface Where { lastChecked: string | null; rows: WhereRow[] }
export interface Change { date: string; title: string; body: string; retest?: string }

export const WHERE = where as Where;
export const CHANGES = (changes as Change[]).slice().sort((a, b) => b.date.localeCompare(a.date));
export const whereIsChecked = (w: Where = WHERE) => !!w.lastChecked && w.rows.every((r) => !!r.where);
