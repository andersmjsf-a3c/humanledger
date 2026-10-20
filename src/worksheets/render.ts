import type { Answers, Worksheet } from "./types";

// The file the person keeps. Plain Markdown, readable without us, ready to paste into any AI.
export function renderMarkdown(ws: Worksheet, answers: Answers, savedOn: string): string {
  const lines: string[] = [`# ${ws.id}. ${ws.title}`, "", `_Saved ${savedOn}._`, ""];
  for (const p of ws.prompts) {
    lines.push(`## ${p.label}`, "");
    if (p.kind === "table" && p.rows && p.columns) {
      lines.push(`| | ${p.columns.join(" | ")} |`, `|---|${p.columns.map(() => "---").join("|")}|`);
      p.rows.forEach((row, r) => {
        const cells = p.columns!.map((_, c) => (answers[`${p.id}.${r}.${c}`] ?? "").replace(/\|/g, "\\|").replace(/\n/g, " "));
        lines.push(`| ${row} | ${cells.join(" | ")} |`);
      });
    } else {
      lines.push(answers[p.id]?.trim() || "_(not answered yet)_");
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function fileNameFor(ws: Worksheet): string {
  return `worksheets/${ws.id}-${ws.slug}.md`;
}
