// Builds the grading skill zip in the browser, with this site's address written into it,
// so the review links it makes come back here. Nothing about the person goes into it.
import { strToU8, zipSync } from "fflate";
import grader from "./generated/grader.json";

export const GRADER_VERSION = grader.version;
export const GRADER_FILES: Record<string, string> = grader.files;
export const SITE_PLACEHOLDER = "{{SITE_URL}}";

export function graderFiles(siteUrl: string): Record<string, string> {
  if (!/^https?:\/\/[^\s"'{}]+$/.test(siteUrl)) throw new Error("not a site address");
  const site = siteUrl.replace(/\/+$/, "");
  return Object.fromEntries(Object.entries(GRADER_FILES).map(([p, text]) => [p, text.split(SITE_PLACEHOLDER).join(site)]));
}

export function packageGrader(siteUrl: string): Uint8Array {
  const files = graderFiles(siteUrl);
  return zipSync(Object.fromEntries(Object.entries(files).map(([p, t]) => [p, strToU8(t)])), { level: 9, mtime: new Date("2026-10-22T00:00:00Z") });
}
