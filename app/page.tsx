import { PRODUCT_NAME } from "@/config/brand";
import { DO_PAGES, TILES, termBySlug } from "@/service";
import { CHANGES, HOME_ROWS, WHERE, firstSentence, rowById, whereIsChecked } from "@/service/reference";

// The approved Oct 26 homepage, rebuilt with the site's styles. Copy from content/service/do/homepage-copy.md.
export default function Home() {
  const checked = whereIsChecked();
  return (
    <main className="home">
      <section className="hero wrap">
        <p className="eyebrow">For anyone using AI at work</p>
        <h1>AI changes every week. What you know about it shouldn&apos;t have to start over.</h1>
        <p className="sub">
          The names move, the settings move, the model you were talking to gets replaced. {PRODUCT_NAME} makes it
          understandable in plain words, keeps what you learn organized in one place that&apos;s yours, and gives you tools that
          make it work better for you. No course. No signup to start.
        </p>
        <div className="buttons">
          <a className="btn" href="#do">Start with what you&apos;re trying to do</a>
          <a className="btn-quiet" href="/what-changed">See what changed this week</a>
        </div>
      </section>

      <section id="do" className="band">
        <div className="wrap">
          <h2 className="section-title">What are you trying to do?</h2>
          <p className="section-sub">
            Pick the one closest. Each opens a short page: the rule in a paragraph, something to paste into your AI right now, and
            an example.
          </p>
          <div className="tiles">
            {TILES.map((t) => {
              const page = DO_PAGES.find((p) => p.n === t.n);
              return (
                <a key={t.n} className="tile" href={page ? `/do/${page.slug}` : "#do"}>
                  <span className="tile-title">{t.title}</span>
                  <span className="tile-covers">{t.covers}</span>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="wrap three">
        <h2 className="section-title">Three things, in the order you&apos;ll want them</h2>
        <p className="section-sub">Most people never get past the first. That&apos;s fine. The second and third are there when a result is worth keeping.</p>
        <div className="cols">
          <div>
            <p className="eyebrow">Understand</p>
            <h3>Plain words for all of it</h3>
            <p>
              A <a href="/glossary">glossary</a> where every term gets one or two sentences a person can repeat. A page that says{" "}
              <a href="/where-things-live">where each setting and feature is today</a>, dated, and what it used to be called. A{" "}
              <a href="/what-changed">log of what changed</a> and what to re-check. Free, no account.
            </p>
          </div>
          <div>
            <p className="eyebrow">Organize</p>
            <h3>One place for what you&apos;ve learned</h3>
            <p>
              Your rules, your voice, your skills, your corrections, kept as files you own, versioned, and ready to load into your
              AI. The service never reads them. It keeps score of how they&apos;re doing and tells you when one needs a re-test.
            </p>
          </div>
          <div>
            <p className="eyebrow">Tools</p>
            <h3>Make it work better for you</h3>
            <p>
              Turn a conversation where you corrected it three times into a skill it reads every time. Run a{" "}
              <a href="/check">check on a draft</a> before anything goes out. <a href="/grader">Grade your work</a> in your own
              AI and keep the score.
            </p>
          </div>
        </div>
      </section>

      <section id="where" className="night">
        <div className="wrap split">
          <div>
            <p className="eyebrow">Where things live</p>
            <h2 className="section-title">As of today. This page will be wrong first, so we keep it current.</h2>
            <p className="section-sub">The habits don&apos;t move. Only the buttons do. When a release lands, this page is what we update first, with the date.</p>
            <a className="btn-quiet" href="/where-things-live">See the whole page</a>
          </div>
          <div className="panel">
            <div className="row">
              <span>Last checked</span>
              <strong>{checked ? WHERE.lastChecked : "First check in progress"}</strong>
            </div>
            {HOME_ROWS.map((h) => {
              const r = rowById(h.id);
              return (
                <div key={h.id} className="row">
                  <span>{h.label}</span>
                  <strong>{checked && r ? (r.thing.includes(": ") ? r.thing.split(": ")[1] : firstSentence(r.whereToday)) : "Listed once checked"}</strong>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="changed" className="wrap split">
        <div>
          <p className="eyebrow">What changed</p>
          <h2 className="section-title">A new model landed. Here&apos;s what to re-check.</h2>
          <p className="section-sub">
            Every release, in civilian terms: what&apos;s different, what it tends to break in the rules people keep, and the
            five-minute re-test to run on anything you rely on.
          </p>
        </div>
        <div className="stack">
          {CHANGES.length ? (
            CHANGES.slice(0, 2).map((c) => (
              <article key={c.id} className="card">
                <p className="meta">{c.date}</p>
                <h3>{c.title}</h3>
                <p>{c.whatChanged}</p>
                <p>
                  <a href={`/what-changed#${c.id}`}>What to re-check</a>
                </p>
              </article>
            ))
          ) : (
            <article className="card">
              <h3>The first entries are being written.</h3>
              <p>
                Until they&apos;re up, the re-test routine is on <a href="/do/what-just-changed">Figure out what just changed</a>.
              </p>
            </article>
          )}
        </div>
      </section>

      <section id="glossary" className="band">
        <div className="wrap">
          <div className="split-head">
            <div>
              <h2 className="section-title">A glossary you can repeat out loud</h2>
              <p className="section-sub">One or two sentences each. No jargon in the definition of jargon.</p>
            </div>
            <a className="btn-quiet" href="/glossary">The full glossary</a>
          </div>
          <div className="cols cards">
            {["skill", "hallucination", "agent"].map((s) => {
              const t = termBySlug(s)!;
              return (
                <div key={s} className="card">
                  <h3>{t.term}</h3>
                  <p dangerouslySetInnerHTML={{ __html: t.definitionHtml }} />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="wrap mission">
        <h2>Helping every person lead AI, keep what they learn, and build on it.</h2>
        <p className="section-sub">
          The intelligence is the machine&apos;s. The lead is yours. Nothing you make here leaves your hands unchecked, and nothing
          you keep here is read by anyone but you.
        </p>
        <a className="btn" href="#do">Start with what you&apos;re trying to do</a>
      </section>
    </main>
  );
}
