// What the reader typed into a page's Try it now. It stays in this browser tab (sessionStorage),
// is never sent anywhere, and travels to the form only when they click Keep this.
import type { PromptPart } from "./types";

export interface Kept {
  from: string; // page slug
  title: string; // page title
  code: string; // workbook code it was kept to
  href: string; // the form's path
  text: string; // the prompt as they filled it in
}

const TRY = (slug: string) => `tryit:${slug}`;
const KEEP = "keepThis";

export function fillPrompt(parts: PromptPart[], values: Record<number, string>): string {
  return parts.map((p, i) => ("text" in p ? p.text : values[i]?.trim() || `[${p.blank}]`)).join("");
}

export function loadValues(slug: string): Record<number, string> {
  try {
    return JSON.parse(sessionStorage.getItem(TRY(slug)) ?? "{}");
  } catch {
    return {};
  }
}

export function saveValues(slug: string, values: Record<number, string>) {
  try {
    sessionStorage.setItem(TRY(slug), JSON.stringify(values));
  } catch {
    // storage blocked: the page still works, it just won't remember
  }
}

export function keep(k: Kept) {
  try {
    sessionStorage.setItem(KEEP, JSON.stringify(k));
  } catch {
    // storage blocked: the form opens empty
  }
}

export function keptFor(path: string): Kept | null {
  try {
    const k = JSON.parse(sessionStorage.getItem(KEEP) ?? "null") as Kept | null;
    return k && k.href === path ? k : null;
  } catch {
    return null;
  }
}

export function forget() {
  try {
    sessionStorage.removeItem(KEEP);
  } catch {
    // nothing to clear
  }
}
