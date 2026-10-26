import { CHANGES, CHANGES_INTRO } from "@/service/reference";

export const metadata = { title: "What changed", description: "Every release, in civilian terms, with the re-test to run." };

export default function WhatChanged() {
  return (
    <main>
      <h1>What changed</h1>
      <p className="lede">
        {CHANGES_INTRO ??
          "Every release in plain words: what's different, which habits it tends to loosen, and the five-minute re-test to run on anything you rely on."}
      </p>
      {CHANGES.length ? (
        CHANGES.map((c) => (
          <article key={c.id} id={c.id} className="card change">
            <p className="meta">{c.date}</p>
            <h3>{c.title}</h3>
            <p>{c.whatChanged}</p>
            {c.whatItLoosens && (
              <p>
                <strong>What it tends to loosen:</strong> {c.whatItLoosens}
              </p>
            )}
            {c.reTest && (
              <p>
                <strong>The re-test:</strong> {c.reTest}
              </p>
            )}
            {c.source && (
              <p className="meta">
                <a href={c.source} rel="noreferrer">
                  Source
                </a>
              </p>
            )}
          </article>
        ))
      ) : (
        <div className="card">
          <h3>The first entries are being written.</h3>
          <p>
            Until they&apos;re up, the routine to run after any release is on <a href="/do/what-just-changed">Figure out what just changed</a>.
          </p>
        </div>
      )}
    </main>
  );
}
