import data from "./generated/service.json";

export interface Screenshot {
  file: string;
  alt: string;
  caption: string;
  worksheets?: string[];
  where?: string[];
  starters?: string[] | "all";
  skills?: string[];
  glossary?: boolean;
  home?: boolean;
  showMeWhere?: boolean; // general how-to screens a starter page keeps behind "Show me where" (Oct 30)
}

// Only placed, not-held screenshots are in the generated data (and in public/screenshots).
export const SCREENSHOTS = (data as unknown as { screenshots: Screenshot[] }).screenshots;
export const SCREENSHOTS_TAKEN = (data as unknown as { screenshotsTaken: string }).screenshotsTaken;

export const shotsFor = {
  worksheet: (id: string) => SCREENSHOTS.filter((s) => s.worksheets?.includes(id)),
  where: (id: string) => SCREENSHOTS.filter((s) => s.where?.includes(id)),
  starter: (id: string) => SCREENSHOTS.filter((s) => s.starters === "all" || s.starters?.includes(id)),
  skill: (id: string) => SCREENSHOTS.filter((s) => s.skills?.includes(id)),
  glossary: () => SCREENSHOTS.filter((s) => s.glossary),
  home: () => SCREENSHOTS.filter((s) => s.home),
};
