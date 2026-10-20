import { fieldsOf, type Answers, type Worksheet } from "./types";

const strip = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
const cell = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

// The file the person keeps: the questions and their own answers, readable without us.
export function renderMarkdown(ws: Worksheet, answers: Answers, savedOn: string): string {
  const lines: string[] = [`# ${ws.id}. ${ws.title}`, "", `_Saved ${savedOn}._`, ""];
  for (const s of ws.yourTurn) {
    if (s.type === "item") {
      lines.push(`## ${s.n}. ${s.question}`, "");
      for (const f of s.fields) {
        const v = (answers[f.key] ?? "").trim();
        const shown = f.kind === "check" ? (v ? "Done" : "_(not done yet)_") : v || "_(not answered yet)_";
        lines.push(f.label && f.kind !== "check" ? `- ${f.label}: ${shown}` : shown);
      }
      lines.push("");
    } else if (s.type === "table") {
      const header = s.header.map(cell);
      lines.push(`| ${header.join(" | ")} |`, `|${header.map(() => "---").join("|")}|`);
      for (const r of s.rows) {
        const cells = r.cells.map((c, i) => (i === s.blankCol && r.field ? cell(answers[r.field.key] ?? "") : cell(strip(c))));
        lines.push(`| ${cells.join(" | ")} |`);
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

export function fileNameFor(ws: Worksheet): string {
  return `worksheets/${ws.id}-${ws.slug}.md`;
}

export function hasAnswers(ws: Worksheet, answers: Answers): boolean {
  return fieldsOf(ws).some((f) => (answers[f.key] ?? "").trim());
}
