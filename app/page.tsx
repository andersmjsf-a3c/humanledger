import { PRODUCT_NAME } from "@/config/brand";
import { STARTERS } from "@/service";
import { Glyph } from "@/brand/Glyph";
import { BELOW, CANT_SEE, CHANGED_CARD, EVERYTHING_YOURS, MINUTES, WHERE_CARD } from "@/service/home";

// Homepage v3 (Oct 31 2026), the same page for everyone, signed in or not. Structure follows the
// who-we-are page: we are, we serve, the starters, we believe, the waterline, we never, how it should
// feel, Where things live and What changed, why the name. Copy: keelsound-brand messaging.md and the
// v3 reference build. Layout and palette from the reference; built in our own components.

const ROLES = [
  ["The solo consultant", "Proposals, client notes, and a voice that has to stay yours across forty emails a week."],
  ["The practice owner", "Two or three people, one reputation, and every number in a letter checked before it goes."],
  ["The sales manager", "A weekly report, a team that pastes whatever the tool says, and a boss who reads closely."],
  ["The nonprofit director", "Grant language, a board, and no budget for a mistake in a figure."],
  ["The first-year founder", "A deck, a brief, and the question of who the company is before the logo."],
  ["The teacher", "Parent emails, a department memo, and a tool that has to sound like a person."],
];

const BELIEFS = [
  ["The person leads.", "The intelligence is the machine's. The center and the tiller are yours. Every card here ends in a decision you make; nothing acts on its own."],
  [
    "Nothing leaves your hands unchecked.",
    "A clean pass is the start of a check, not permission to skip one. Put the materials away and explain your argument in three minutes. If you can't, it isn't yours yet.",
  ],
  ["Nothing you keep is read by anyone but you.", "Not a feature. The reason the vault is built the way it is."],
  [
    "Files compound. Conversations don't.",
    "A chat is gone when the window closes. A file gets a line added every time it's wrong, and works in the next model too. The unit of everything here is a file you own.",
  ],
];

const FEEL = [
  ["Nothing is hidden.", "Where things live is dated and re-checked after every model release. The glossary is one or two sentences you can repeat. Nothing here needs the Terminal."],
  ["Everything is yours.", EVERYTHING_YOURS],
  [
    "The next release isn't a threat.",
    "When the model changes, your rules don't. Your sounding tells you which keeps to re-test, and the file is still yours in whatever you're talking to next year.",
  ],
];

export default function Home() {
  return (
    <main className="v3">
      {/* We are */}
      <section className="v3-hero wrap">
        <p className="v3-label">Lead your AI. Keep what you learn. Bring it with you.</p>
        <h1>AI changes under you every few weeks. {PRODUCT_NAME} is the part that doesn&apos;t.</h1>
        <p className="v3-lead">
          The model gets replaced, the settings move, the names change. What you know about your own work shouldn&apos;t go with them.{" "}
          {PRODUCT_NAME} gives you keeps you can use today, keeps the files you make in a vault only you can open, and tells you
          what&apos;s current and what to fix next. You lead.
        </p>
        <div className="v3-buttons">
          <a className="btn" href="#starters">
            Pick a starter
          </a>
          <a className="btn ghost" href="#never">
            What we can&apos;t see
          </a>
        </div>
        <p className="v3-quiet">Nothing you keep here is read by anyone but you. No signup to start; sign in only to keep.</p>
      </section>

      {/* We serve */}
      <section className="v3-section alt">
        <div className="wrap">
          <p className="v3-label">Who it&apos;s for</p>
          <h2>People who use AI at work and have no one to show them how.</h2>
          <p className="v3-sub">Smart, busy, not technical, and judged by what leaves their hands. If you recognize yourself, this was built for you.</p>
          <div className="v3-roles">
            {ROLES.map(([who, what], i) => (
              <div key={who} className="v3-role">
                <span className="n">{i + 1}</span>
                <div>
                  <b>{who}</b>
                  <span>{what}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The starters: the existing eight, each to its three-question page */}
      <section id="starters" className="v3-section">
        <div className="wrap">
          <p className="v3-label">Starter Keeps</p>
          <h2>Eight keeps, already written. Three answers make one yours.</h2>
          <p className="v3-sub">
            A keep is a file your AI reads before it works for you: a standing order you own. You take it from Keelsound and add it to Claude in a few clicks. These eight are written and tested. Answer three questions, download the
            file, drop it into Claude. Every correction you&apos;d otherwise repeat goes into the file, and it never gets worse.
          </p>
          <div className="v3-starters">
            {STARTERS.map((s) => (
              <a key={s.id} className="v3-st" href={`/start/${s.id}`}>
                <b>{s.title}</b>
                <p>{s.oneLine}</p>
                <span className="q">
                  {s.questions.length} questions{MINUTES[s.id] ? ` · about ${MINUTES[s.id]} minutes` : ""}
                </span>
              </a>
            ))}
          </div>
          <p className="v3-quiet">
            Build Keeps (brand, go-to-market, presentations, proposals) and Advanced Keeps (agents with a job, a boundary, and a log) are
            coming. The starters are free and stay free.
          </p>
        </div>
      </section>

      {/* We believe */}
      <section className="v3-section alt v3-believe">
        <div className="wrap">
          <p className="v3-label">What we believe</p>
          <p className="big">
            <em>The person is the constant.</em> Models change, settings move, names come and go. What you know about your own work should
            come with you into all of it.
          </p>
          <div className="v3-beliefs">
            {BELIEFS.map(([t, b]) => (
              <div key={t}>
                <b>{t}</b>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The waterline */}
      <div className="v3-waterline" role="separator">
        <span>Below the waterline</span>
      </div>

      {/* We never */}
      <section className="v3-below" id="never">
        <div className="wrap">
          <p className="v3-label">What we never do</p>
          <h2>{PRODUCT_NAME} is built so the company can&apos;t read your work.</h2>
          <p className="v3-sub">{BELOW.sub}</p>
          <div className="v3-nevers">
            {BELOW.nevers.map((n) => (
              <div key={n.title} className="never">
                <b>{n.title}</b>
                <span>{n.body}</span>
              </div>
            ))}
          </div>
          <div className="v3-see">
            <div>
              <b>What we can see</b>
              <ul>
                {BELOW.canSee.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
            <div>
              <b>What we can&apos;t</b>
              <ul>
                {CANT_SEE.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="v3-proof">
            The complete list of what our server holds is on the <a href="/privacy">privacy page</a>, in plain words. A test fails our build if
            anything else appears. We never name a customer, and nobody on this page is a testimonial.
          </p>
        </div>
      </section>

      {/* How it should feel */}
      <section className="v3-section">
        <div className="wrap">
          <p className="v3-label">How it should feel</p>
          <h2>Someone careful set this up, and you could walk away tomorrow with everything you made.</h2>
          <div className="v3-feel">
            {FEEL.map(([t, b]) => (
              <div key={t}>
                <b>{t}</b>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reference, from the dated JSON */}
      <section className="v3-section alt" id="where">
        <div className="wrap v3-ref">
          <div className="card">
            <h3>
              <a href="/where-things-live">Where things live</a>
            </h3>
            <p className="date">
              {WHERE_CARD.checked ? `Last checked ${WHERE_CARD.checked}. ` : ""}Names and titles change; this page changes with them.
            </p>
            {WHERE_CARD.rows.map((r) => (
              <div key={r.id} className="row">
                <span>{r.label}</span>
                <span>{r.value}</span>
              </div>
            ))}
            <a className="more" href="/where-things-live">
              Every row, with sources
            </a>
          </div>
          <div className="card" id="changed">
            <h3>
              <a href="/what-changed">What changed</a>
            </h3>
            <p className="date">Since the last release, in plain words.</p>
            {CHANGED_CARD.map((e) => (
              <div key={e.id} className="row">
                <span>{e.date}</span>
                <span>{e.title}</span>
              </div>
            ))}
            <a className="more" href="/what-changed">
              What each one loosens, and the re-test
            </a>
          </div>
        </div>
      </section>

      {/* Why the name */}
      <section className="v3-section" id="about">
        <div className="wrap">
          <p className="v3-label">Why {PRODUCT_NAME}</p>
          <h2>The keel is the part of a boat you don&apos;t see.</h2>
          <p className="v3-sub">
            It&apos;s what lets you sail into the wind without going over, and you still hold the tiller. Sound, as in a sound hull: nothing
            gets in, nothing leaks out. And a sounding is the depth check a sailor takes. {PRODUCT_NAME} can&apos;t read a word you write. It
            keeps what you know about your own work and brings it with you into every new model.
          </p>
          <div className="v3-glyphrow">
            <Glyph size={96} />
            <p>
              The water is the AI: it moves, it has depth, it changes every few weeks. The hull is you. The waterline is the boundary between
              what&apos;s yours and what&apos;s the machine&apos;s. The keel is the part of you that goes down into that layer and stays yours.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
