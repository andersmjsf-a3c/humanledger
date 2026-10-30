import { STARTERS } from "@/service";

// The front door (Oct 30 2026): lead with skills already written. Pick one, answer three
// questions, load it into Claude. Everything about the habits sits behind the bottom row.
export default function Home() {
  return (
    <main className="home v2">
      <section className="hero wrap">
        <h1>Your AI, set up the way you work. Start with a skill we&apos;ve already written.</h1>
        <p className="sub">
          Pick one. Answer three questions. Load it into Claude. It gets better every time you correct it, and the file is yours.
        </p>
        <div className="buttons">
          <a className="btn" href="#starters">
            Pick a starter
          </a>
        </div>
      </section>

      <section id="how" className="wrap picture">
        <img
          src="/illustrations/how-it-works.svg"
          alt="Four steps: pick a starter, answer three questions, load it into Claude, it gets better as you fix it."
          width={1200}
          height={340}
        />
      </section>

      <section id="starters" className="band">
        <div className="wrap">
          <h2 className="section-title">Six starters. Pick the one you&apos;d use today.</h2>
          <div className="starters">
            {STARTERS.map((s) => (
              <article key={s.id} className="starter-card">
                <h3>{s.title}</h3>
                <p>{s.oneLine}</p>
                <a className="btn" href={`/start/${s.id}`}>
                  Make it mine
                </a>
              </article>
            ))}
          </div>
          <p className="meta">No account to try one. Sign in only when you want to keep it.</p>
        </div>
      </section>

      <section className="wrap split whatskill">
        <div>
          <h2 className="section-title">What a skill is</h2>
          <p className="section-sub">
            A one-page file your AI reads before it does a job for you. It says what the job is, what you want, and what it must
            never do. Every time it gets something wrong, you add a line. That&apos;s the whole idea, and it&apos;s why the tenth draft
            is better than the first.
          </p>
          <p className="meta">
            We keep the scores. Your files stay in your vault; we never read them. <a href="/privacy">What we can see</a>
          </p>
        </div>
        <div className="picture framed">
          <img
            src="/illustrations/a-skill-file.svg"
            alt="A skill file with five callouts: the job, your three answers, the steps, what it must never do, where your corrections go."
          />
        </div>
      </section>

      <section id="confusing" className="confusing">
        <div className="wrap">
          <strong>When something&apos;s confusing</strong>
          <nav aria-label="When something's confusing">
            <a href="/glossary">A word everyone keeps using</a>
            <a href="/where-things-live">Where a setting went (dated)</a>
            <a href="/what-changed">What changed this week</a>
            <a href="/why">Why any of this works</a>
          </nav>
        </div>
      </section>
    </main>
  );
}
