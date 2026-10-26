import { PRODUCT_NAME } from "@/config/brand";

export const metadata = { title: "Privacy", description: "What leaves your vault, in plain words." };

// Written from the code as it stands; every claim here is checked by the privacy tests in CI.
export default function Privacy() {
  return (
    <main className="privacy">
      <h1>Privacy: what leaves your vault</h1>
      <p className="lede">
        Your work stays with you. The only thing {PRODUCT_NAME} ever receives is a scorecard, and only when you click Send.
      </p>

      <div className="flow" aria-label="How data moves">
        <div className="box">
          <strong>Your browser and your folder</strong>
          <span>Worksheet answers, skills, drafts you check, what you type on a page</span>
          <em>Stays here</em>
        </div>
        <div className="arrow" aria-hidden="true">→</div>
        <div className="box">
          <strong>Your own AI</strong>
          <span>The grading skill reads your work there and writes a scorecard</span>
          <em>Stays there</em>
        </div>
        <div className="arrow" aria-hidden="true">→</div>
        <div className="box send">
          <strong>You click Send</strong>
          <span>Numbers, dates, fixed categories, yes or no. Never a sentence from your work</span>
          <em>The only thing that reaches us</em>
        </div>
      </div>

      <h2>What stays on your device</h2>
      <p>
        Everything you write. Worksheet answers and skills are saved in this browser and, if you choose, in a folder on your
        computer. Text you paste into the draft checker is checked in your browser and never saved. What you type into a
        page&apos;s Try it now stays in that browser tab. None of it is sent to us. The pages that hold your work have no way to
        send it: our tests fail if anyone adds one.
      </p>

      <h2>What we store</h2>
      <ul className="steps">
        <li>Your email address, so you can sign in. No password: we email a one-time link that expires in 15 minutes.</li>
        <li>That you&apos;re signed in, as a random token we keep only a fingerprint of.</li>
        <li>
          The scorecards you send. Every line is a number, a date, a category from a fixed list, or yes or no. Before anything is
          sent you see every line, in plain words and as the exact data, and you can hold any line back.
        </li>
      </ul>

      <h2>What we never see</h2>
      <p>
        Your files, your answers, your drafts, your skills, their names, or anything you typed. The grading skill runs in your own
        AI and can&apos;t send anything itself. Skills are recorded by kind (voice, brand, research), never by name, because a name
        can give away a client.
      </p>

      <h2>Who helps us run it</h2>
      <p>
        Vercel hosts the site and keeps standard request logs, like any website. Neon holds the database: your email address,
        sign-in tokens, and scorecards. Resend sends the sign-in email. None of them receives your work, because we never have it.
      </p>

      <h2>What we don&apos;t do</h2>
      <p>
        No ads, no tracking scripts, no selling or sharing. No one at {PRODUCT_NAME} can read your files, because they never leave
        your hands.
      </p>
    </main>
  );
}
