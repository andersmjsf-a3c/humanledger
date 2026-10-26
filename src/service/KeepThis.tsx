"use client";
import { FORM_ROUTES } from "./index";
import { fillPrompt, keep, loadValues } from "./keep";
import type { PromptPart } from "./types";

// "Turn it into a file": opens the matching form with what the reader typed on this page.
// Forms keep answers in this browser and their own folder, so no account is needed to start.
export function KeepThis({ slug, title, codes, parts }: { slug: string; title: string; codes: string[]; parts: PromptPart[] }) {
  const built = codes.filter((c) => FORM_ROUTES[c]);
  const waiting = codes.filter((c) => !FORM_ROUTES[c]);
  if (!codes.length) return null;

  const go = (code: string) => {
    const r = FORM_ROUTES[code];
    keep({ from: slug, title, code, href: r.href, text: fillPrompt(parts, loadValues(slug)) });
    window.location.href = r.href;
  };

  return (
    <div className="keep">
      {built.map((c, i) => (
        <button key={c} className={i === 0 ? "primary" : "secondary"} onClick={() => go(c)}>
          {i === 0 ? "Turn it into a file: " : "Or: "}
          {FORM_ROUTES[c].label}
        </button>
      ))}
      {waiting.length > 0 && <p className="meta">Not on the site yet: {waiting.join(", ")}. It&apos;s next in line.</p>}
      <p className="fineprint">The file stays in this browser and, if you choose, a folder on your computer. We never see it.</p>
    </div>
  );
}
