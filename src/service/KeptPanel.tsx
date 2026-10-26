"use client";
import { useEffect, useState } from "react";
import { forget, keptFor, type Kept } from "./keep";

export function KeptPanel({ path }: { path: string }) {
  const [k, setK] = useState<Kept | null>(null);
  useEffect(() => setK(keptFor(path)), [path]);
  if (!k) return null;
  return (
    <aside className="kept">
      <p className="meta">
        From <a href={`/do/${k.from}`}>{k.title}</a>. What you filled in there, to copy into the boxes below:
      </p>
      <pre className="preview">{k.text}</pre>
      <div className="actions">
        <button className="secondary" onClick={() => navigator.clipboard?.writeText(k.text).catch(() => undefined)}>
          Copy
        </button>
        <button
          className="secondary"
          onClick={() => {
            forget();
            setK(null);
          }}
        >
          Done with it
        </button>
      </div>
    </aside>
  );
}
