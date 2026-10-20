"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { zipSync, strToU8 } from "fflate";
import type { SkillAnswers, SkillTemplate } from "@/skills/types";
import { SHARED_NAME } from "@/skills/parse";
import { blanksLeft, skillFile } from "@/skills/render";
import { PREFILL } from "@/skills/prefill";
import { bumpVersions } from "../bundle";
import { downloadBytes } from "../folder";
import { SHARED_ID, SKILL_PREFIX } from "../storage";
import { getStore, useVault } from "./useVault";
import { FolderBar } from "./FolderBar";

const BRACKET = /\[([^\]\n]+)\]/g;

// The template, line by line, with each [bracket] turned into a box in place.
export function SkillBuilder({ t }: { t: SkillTemplate }) {
  const vault = useVault();
  const recId = SKILL_PREFIX + t.id;
  const [values, setValues] = useState<SkillAnswers>({});
  const [version, setVersion] = useState<number | undefined>();
  const [loaded, setLoaded] = useState(false);
  const [note, setNote] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const s = getStore();
    Promise.all([s.get(recId), s.get(SHARED_ID)]).then(([r, shared]) => {
      setValues({ ...(shared?.answers ?? {}), ...(r?.answers ?? {}) });
      setVersion(r?.version);
      setLoaded(true);
    });
  }, [recId]);

  function update(key: string, value: string) {
    const next = { ...values, [key]: value };
    setValues(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const s = getStore();
      const own = Object.fromEntries(Object.entries(next).filter(([k]) => k !== SHARED_NAME));
      await s.save(recId, own);
      if (SHARED_NAME in next) await s.save(SHARED_ID, { [SHARED_NAME]: next[SHARED_NAME] });
      vault.refresh();
    }, 600);
  }

  async function prefill(worksheet: string, answer: string, fieldPrefix: string) {
    const ws = await getStore().get(worksheet);
    const text = ws?.answers[answer]?.trim();
    const field = t.fields.find((f) => f.key.startsWith(fieldPrefix));
    if (!field) return;
    if (!text) return setNote(`Nothing saved in ${worksheet} yet. Do that worksheet first, or write it here.`);
    update(field.key, text);
    setNote(`Copied from ${worksheet}. Edit it here; the worksheet keeps its own copy.`);
  }

  const file = useMemo(() => skillFile(t, values), [t, values]);
  const left = blanksLeft(t, values);

  async function download(kind: "zip" | "md") {
    const s = getStore();
    const rec = await s.get(recId);
    const shared = await s.get(SHARED_ID);
    if (rec) {
      const bumped = bumpVersions([rec, ...(shared ? [shared] : [])]);
      if (bumped.length) {
        await s.replaceAll(bumped);
        setVersion(bumped[0].version);
      }
    }
    if (kind === "zip" && t.kind === "skill") downloadBytes(zipSync({ [file.zipPath]: strToU8(file.content) }), `${file.zipPath.split("/")[0]}.zip`);
    else downloadBytes(strToU8(file.content), t.kind === "skill" ? "SKILL.md" : file.zipPath, "text/markdown");
  }

  const input = (key: string, hint: string, kind: "inline" | "short" | "long") => {
    const v = values[key] ?? "";
    if (kind === "long") return <textarea key={key} aria-label={hint} placeholder={hint} rows={5} value={v} onChange={(e) => update(key, e.target.value)} />;
    if (kind === "short") return <input key={key} aria-label={hint} placeholder={hint} value={v} onChange={(e) => update(key, e.target.value)} />;
    return (
      <input key={key} className="inline" aria-label={hint} placeholder={hint} value={v} size={Math.min(Math.max(hint.length, 6), 34)} onChange={(e) => update(key, e.target.value)} />
    );
  };

  let p = 0;
  const lines = t.text.split("\n");
  const prefills = PREFILL.filter((x) => x.template === t.id);

  return (
    <article className="worksheet skillbuilder">
      <p className="crumb">
        <a href="/skills">Skills</a> · {t.kind === "agent" ? "Agent job description" : "Starter skill"}
      </p>
      <p className="lede">
        Fill in the boxes. Anything you leave blank keeps its [bracket], so you can see what's left. Everything stays on this
        device until you download it or save it to your folder.
      </p>
      {prefills.length > 0 && (
        <div className="prefills">
          {prefills.map((x) => (
            <button key={x.label} className="quiet" onClick={() => prefill(x.worksheet, x.answer, x.fieldPrefix)}>
              {x.label}
            </button>
          ))}
          {note && <p className="message">{note}</p>}
        </div>
      )}

      {!loaded ? (
        <p>Loading from this device…</p>
      ) : (
        <div className="template">
          {lines.map((line, li) => {
            const fields = [...line.matchAll(BRACKET)];
            const heading = line.match(/^(#{1,3}) (.*)$/);
            const marker = line.match(/^(\s*)([-*]|\d+\.)\s+/);
            const body = heading ? heading[2] : marker ? line.slice(marker[0].length) : line;
            if (!line.trim()) return <div key={li} className="gap" />;
            const whole = fields.length === 1 && /^\s*(?:[-*]|\d+\.)?\s*\[[^\]\n]+\]\s*\.?\s*$/.test(line);
            const parts: React.ReactNode[] = [];
            let last = 0;
            for (const m of body.matchAll(BRACKET)) {
              parts.push(body.slice(last, m.index));
              const f = t.fields.find((x) => x.key === t.placeholders[p]);
              p++;
              parts.push(input(f!.key, m[1], whole ? f!.kind : "inline"));
              last = m.index! + m[0].length;
            }
            parts.push(body.slice(last));
            const Tag = heading ? (heading[1].length === 1 ? "h1" : "h3") : "div";
            return (
              <Tag key={li} className={marker ? "tline item" : "tline"}>
                {marker && <span className="marker">{/\d/.test(marker[2]) ? marker[2] : "•"}</span>}
                <span className="tbody">{parts}</span>
              </Tag>
            );
          })}
        </div>
      )}

      <h2>Your file</h2>
      <p className="meta">
        {left ? `${left} bracket${left === 1 ? "" : "s"} left. ` : "Every bracket filled. "}
        {version ? `Version ${version}.` : "Not downloaded or saved yet."} Saves to <code>{file.path}</code> in your folder.
      </p>
      <pre className="preview">{file.content}</pre>
      <div className="actions">
        {t.kind === "skill" ? (
          <>
            <button className="primary" onClick={() => download("zip")}>Download for Claude (.zip)</button>
            <button onClick={() => download("md")}>Download SKILL.md</button>
          </>
        ) : (
          <button className="primary" onClick={() => download("md")}>Download {file.zipPath}</button>
        )}
      </div>
      {t.kind === "skill" && (
        <p className="fineprint">
          The .zip is ready to upload as a skill. Worksheet 0.5 has the steps. No upload? Paste the file at the top of a
          conversation; that works everywhere.
        </p>
      )}

      <FolderBar vault={vault} />
    </article>
  );
}
