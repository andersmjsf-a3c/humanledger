import { CHANGES } from "@/service/reference";

export const metadata = { title: "What changed", description: "Every release, in civilian terms, with the re-test to run." };

export default function WhatChanged() {
  return (
    <main>
      <h1>What changed</h1>
      <p className="lede">
        Every release, in civilian terms: what&apos;s different, what it tends to break in the rules people keep, and the
        five-minute re-test to run on anything you rely on.
      </p>
      {CHANGES.length ? (
        CHANGES.map((c) => (
          <article key={c.date + c.title} className="card change">
            <p className="meta">{c.date}</p>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
            {c.retest && <p><strong>Re-test:</strong> {c.retest}</p>}
          </article>
        ))
      ) : (
        <div className="card">
          <h3>The first entries are being written.</h3>
          <p>
            Until they&apos;re up, the routine to run after any release is on{" "}
            <a href="/do/what-just-changed">Figure out what just changed</a>.
          </p>
        </div>
      )}
    </main>
  );
}
