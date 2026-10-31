import { PRODUCT_NAME } from "@/config/brand";

export const metadata = { title: "Privacy", description: "What leaves your vault, in plain words." };

// Written from the code as it stands; every claim here is checked by the privacy tests in CI.
// Copy from keelsound-brand messaging.md, limited to what has shipped (Mark, Oct 30: until counsel
// reviews the public claim, the site uses only approved sentences that are true today). The sealed,
// stored vault and the connector get their sentences when they ship.
export default function Privacy() {
  return (
    <main className="privacy">
      <h1>Privacy: what leaves your vault</h1>
      <p className="lede">{PRODUCT_NAME} is built so the company can&apos;t read your work.</p>

      <div className="flow" aria-label="How data moves">
        <div className="box">
          <strong>Your vault: this browser and your folder</strong>
          <span>Starter answers, worksheet answers, skills, drafts you check, what you type on a page</span>
          <em>Stays here</em>
        </div>
        <div className="arrow" aria-hidden="true">→</div>
        <div className="box">
          <strong>Your own AI</strong>
          <span>The grading skill reads your work there and writes your sounding</span>
          <em>Stays there</em>
        </div>
        <div className="arrow" aria-hidden="true">→</div>
        <div className="box send">
          <strong>You click Send</strong>
          <span>Numbers, dates, fixed categories, yes or no. Never a sentence from a file</span>
          <em>The only thing that reaches us</em>
        </div>
      </div>

      <h2>What our server holds</h2>
      <table className="holds">
        <thead>
          <tr>
            <th>What</th>
            <th>Why</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Your email address</td>
            <td>So you can sign in. No password: we email a one-time link that expires in 15 minutes.</td>
          </tr>
          <tr>
            <td>That you&apos;re signed in</td>
            <td>A random token, of which we keep only a fingerprint.</td>
          </tr>
          <tr>
            <td>Your soundings, the ones you send</td>
            <td>
              Your sounding is the depth check you take yourself: counts of what&apos;s current, what&apos;s due, what passed. It is
              numbers, dates, categories, and yes/no. Never a sentence from a file.
            </td>
          </tr>
          <tr>
            <td>Model releases</td>
            <td>Public dates, so we can tell you when a skill is due for a re-test.</td>
          </tr>
          <tr>
            <td>Our own agents&apos; receipts</td>
            <td>How many soundings they read and what they wrote. Counts only.</td>
          </tr>
        </tbody>
      </table>
      <p>The complete list of what our server holds is this page. A test fails our build if anything else appears.</p>

      <h2>What we can see, and what we can&apos;t</h2>
      <p>
        What we can see: that you have an account and your email address, and the soundings you send. What we can&apos;t: your
        files. Not their contents, not their names, not which starter they came from, not a word you wrote.
      </p>

      <h2>Your vault</h2>
      <p>
        Your vault is this browser and, if you choose, a folder on your computer. None of it is sent to us: the pages that hold your
        work have no way to send it, and our tests fail if anyone adds one. Save to my folder keeps your own copy, any time, in the
        format your AI reads.
      </p>

      <h2>Your sounding</h2>
      <p>
        Before anything is sent you see every line, in plain words and as the exact data, and you can hold any line back. Skills are
        recorded by kind (voice, brand, research), never by name, because a name can give away a client. The grading skill runs in
        your own AI and can&apos;t send anything itself.
      </p>

      <h2>Who helps us run it</h2>
      <p>
        A hosting company runs the site and keeps standard request logs, like any website. A database company stores the list above.
        An email company sends the sign-in link. None of them receives your work, because we never have it.
      </p>

      <h2>What we don&apos;t do</h2>
      <p>No ads, no tracking scripts, no selling or sharing. Nothing leaves your hands unless you send it.</p>

      <p className="meta">Last checked October 31, 2026.</p>
    </main>
  );
}
