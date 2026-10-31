import type { CapCard, Dashboard } from "./model";
import { STARTERS } from "@/service";

// Your AI in three tiers (dashboard-spec, Oct 30 2026). Build and Advanced are dashed placeholders:
// not clickable, no state; "Coming soon" is the only promise made.
const BUILD = [
  ["Brand", "From who you are to a full brand system: voice rules, visual rules, and the check that runs on everything."],
  ["Go-to-market", "A playbook as the single reference of truth: who you sell to, how, at what price, and what you never claim."],
  ["Presentations", "Decks briefed for the room, scored against a published standard, and checked before they leave."],
  ["Proposals, plans, and reports", "The long documents your business runs on, in your shape, from your inputs."],
];
// "Claude updates your files" is held: the connector is read-only and can't open the vault (spec part 3).
const ADVANCED = [
  ["Agents with a boundary", "A job, a name, a schedule, and a line it can't cross. Starts with one that only reads and reports."],
  ["Re-tests after every release", "When the model changes, your top skills run again on a known task and you see what drifted."],
  ["Your team's sounding", "Who runs the checks, whose skills are stale, who passes the three-minute test. Counts, never content."],
];

function Placeholder({ title, line }: { title: string; line: string }) {
  return (
    <article className="cap later soon" aria-disabled="true">
      <header>
        <h3>{title}</h3>
      </header>
      <div className="cap-body">
        <p>{line}</p>
      </div>
    </article>
  );
}

const STATE_LABEL = { not_started: "Not started", tried: "Tried", kept: "Kept", connected: "Connected" } as const;

function CapabilityCard({ c, onConfirmMemory }: { c: CapCard; onConfirmMemory?: () => void }) {
  return (
    <article className={`cap ${c.cap.later && c.state === "not_started" ? "later" : ""}`}>
      <header>
        <h3>{STARTERS.find((s) => s.id === c.cap.starter)?.title ?? c.cap.title}</h3>
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
            Yes, it remembers
          </button>
        )}
      </div>
    </article>
  );
}

export function DashboardView({ d, onConfirmMemory }: { d: Dashboard; onConfirmMemory?: () => void }) {
  const { top } = d;
  const starterCards = STARTERS.map((s) => d.cards.find((c) => c.cap.starter === s.id)).filter((c): c is CapCard => !!c);
  return (
    <>
      <section className="wrap sounding-head">
        <h2 className="section-title">Your sounding</h2>
        <p className="meta">The depth check you take yourself: counts of what&apos;s current, what&apos;s due, what passed.</p>
      </section>
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
            <div>
              <h2 className="section-title">Starter Skills</h2>
              <p className="section-sub">Eight skills we wrote, made yours with three answers each. Live now.</p>
            </div>
            <p className="legend">
              <span><i className="dot dot-connected" /> Connected</span>
              <span><i className="dot dot-kept" /> Kept</span>
              <span><i className="dot dot-tried" /> Tried</span>
              <span><i className="dot dot-not_started" /> Not started</span>
            </p>
          </div>
          <div className="caps">
            {starterCards.map((c) => (
              <CapabilityCard key={c.cap.key} c={c} onConfirmMemory={onConfirmMemory} />
            ))}
          </div>
          <p className="meta">Cards show names, versions, dates, and counts. Never a line from a file.</p>

          <div className="tier">
            <h2 className="section-title">
              Build Skills <span className="soon-badge">Coming soon</span>
            </h2>
            <p className="section-sub">Bigger jobs, built on your starters. Each one reads your voice, your company, and your fact pass before it starts.</p>
            <div className="caps">
              {BUILD.map(([title, line]) => (
                <Placeholder key={title} title={title} line={line} />
              ))}
            </div>
          </div>

          <div className="tier">
            <h2 className="section-title">
              Advanced Skills <span className="soon-badge">Coming soon</span>
            </h2>
            <p className="section-sub">For when your files are doing real work and you want them watched, tested, and shared.</p>
            <div className="caps">
              {ADVANCED.map(([title, line]) => (
                <Placeholder key={title} title={title} line={line} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="wrap split nextfor">
        <div>
          <p className="eyebrow">Your next step</p>
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
              <span>
                {top.filesKept === 0
                  ? "Nothing in your vault yet. Pick a starter above; the first one takes about three minutes."
                  : "What you keep and check shows up here as dates and counts."}
              </span>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
