import type { CapCard, Dashboard } from "./model";

const STATE_LABEL = { not_started: "Not started", tried: "Tried", kept: "Kept", connected: "Connected" } as const;

function CapabilityCard({ c, onConfirmMemory }: { c: CapCard; onConfirmMemory?: () => void }) {
  return (
    <article className={`cap ${c.cap.later && c.state === "not_started" ? "later" : ""}`}>
      <header>
        <h3>{c.cap.title}</h3>
        <span className={`dot dot-${c.state}`} title={STATE_LABEL[c.state]} aria-label={STATE_LABEL[c.state]} />
      </header>
      <div className="cap-body">
        {c.fileLine && <p className="file">{c.fileLine}</p>}
        {c.connection && <p>{c.connection}</p>}
        {c.health.map((h) => (
          <p key={h}>{h}</p>
        ))}
        {c.state === "not_started" && !c.cap.later && <p className="quiet">Not started</p>}
        {c.cap.later && c.state === "not_started" && <p>{c.next}</p>}
      </div>
      <div className="cap-foot">
        {c.next && !(c.cap.later && c.state === "not_started") && <p className={`next ${c.tone}`}>{c.next}</p>}
        {c.cap.later && c.state === "not_started" && <p className="quiet">Not started</p>}
        <a className={c.action.primary ? "btn" : "btn-quiet"} href={c.action.href}>
          {c.action.label}
        </a>
        {c.cap.key === "memory" && c.state === "kept" && onConfirmMemory && (
          <button className="linklike" onClick={onConfirmMemory}>
            I added it to Claude&apos;s memory
          </button>
        )}
      </div>
    </article>
  );
}

export function DashboardView({ d, onConfirmMemory }: { d: Dashboard; onConfirmMemory?: () => void }) {
  const { top } = d;
  return (
    <>
      <section className="wrap stats">
        <div className="stat">
          <strong>{top.filesKept}</strong>
          <span>files kept in your vault</span>
        </div>
        <div className="stat">
          <strong>{top.checksThisWeek}</strong>
          <span>checks run this week</span>
        </div>
        <div className="stat">
          <strong>{top.threeMinute.of ? `${top.threeMinute.passed} of ${top.threeMinute.of}` : "0"}</strong>
          <span>three-minute tests passed</span>
        </div>
        <div className={`stat ${top.skillsToRetest > 0 ? "warn" : ""}`}>
          <strong>{top.skillsToRetest}</strong>
          <span>skills to re-test{top.lastRelease ? ` since the ${new Date(`${top.lastRelease.date}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} release` : ""}</span>
        </div>
      </section>

      <section id="capabilities" className="band">
        <div className="wrap">
          <div className="split-head">
            <h2 className="section-title">Your capabilities</h2>
            <p className="legend">
              <span><i className="dot dot-connected" /> Connected</span>
              <span><i className="dot dot-kept" /> Kept</span>
              <span><i className="dot dot-tried" /> Tried</span>
              <span><i className="dot dot-not_started" /> Not started</span>
            </p>
          </div>
          <div className="caps">
            {d.cards.map((c) => (
              <CapabilityCard key={c.cap.key} c={c} onConfirmMemory={onConfirmMemory} />
            ))}
          </div>
          <p className="meta">
            Cards show names, versions, dates, and counts. Never a line from a file. <a href="/glossary">Understand a word</a> is in the top menu.
          </p>
        </div>
      </section>

      <section className="wrap split nextfor">
        <div>
          <p className="eyebrow">Next for you</p>
          <h2 className="section-title">{d.next.title}</h2>
          <p className="section-sub">{d.next.why}</p>
          <a className={d.next.action.primary ? "btn" : "btn-quiet"} href={d.next.action.href}>
            {d.next.action.label}
          </a>
        </div>
        <div className="activity">
          {d.activity.length ? (
            d.activity.map((a, i) => (
              <div key={i} className="row">
                <span>
                  {a.date} · {a.what}
                </span>
                <strong className={a.good ? "good" : ""}>{a.value}</strong>
              </div>
            ))
          ) : (
            <div className="row">
              <span>Nothing yet. What you keep and check shows up here as dates and counts.</span>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
