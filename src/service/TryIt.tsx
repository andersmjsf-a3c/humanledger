"use client";
import { useEffect, useState } from "react";
import type { PromptPart } from "./types";
import { fillPrompt, loadValues, saveValues } from "./keep";

// The paste-ready prompt with its blanks as fields. Typing here never leaves this tab.
export function TryIt({ slug, parts }: { slug: string; parts: PromptPart[] }) {
  const [values, setValues] = useState<Record<number, string>>({});
  const [copied, setCopied] = useState(false);
  useEffect(() => setValues(loadValues(slug)), [slug]);

  const set = (i: number, v: string) => {
    const next = { ...values, [i]: v };
    setValues(next);
    saveValues(slug, next);
    setCopied(false);
  };
  const blanks = parts.filter((p) => "blank" in p).length;

  return (
    <div className="tryit">
      <blockquote className="prompt">
        {parts.map((p, i) =>
          "text" in p ? (
            <span key={i}>{p.text}</span>
          ) : (
            <input
              key={i}
              className="blank"
              aria-label={p.blank}
              placeholder={p.blank}
              value={values[i] ?? ""}
              size={Math.min(Math.max(p.blank.length, 8), 40)}
              onChange={(e) => set(i, e.target.value)}
            />
          ),
        )}
      </blockquote>
      <div className="actions">
        <button
          className="primary"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(fillPrompt(parts, values));
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? "Copied" : "Copy it"}
        </button>
        <span className="meta">
          {blanks ? "Fill in the blanks, copy, and paste it into your AI. " : "Copy it and paste it into your AI. "}
          What you type stays in this tab. Nothing is sent to us.
        </span>
      </div>
    </div>
  );
}
