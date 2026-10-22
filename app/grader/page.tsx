import { GraderDownload } from "@/grader/GraderDownload";

export const metadata = { title: "Grade your work" };

export default function Grader() {
  return (
    <main>
      <h1>Grade your work</h1>
      <p className="lede">
        The grading skill runs in your own Claude, next to your files. It checks a piece of work against your rules, gives you
        the full report, and makes a scorecard. Your work never comes here. Only the scorecard can, and only when you send it.
      </p>

      <GraderDownload />

      <h2>How it works</h2>
      <ol className="steps">
        <li>Add the zip to Claude as a skill. Once.</li>
        <li>
          In a conversation with your draft and your files, say <em>grade this</em>. For a skill, say <em>re-test my voice
          skill</em>.
        </li>
        <li>You get the full report: which lines tripped which of your rules, which claims had no source. That stays in Claude.</li>
        <li>
          It asks you two things only you know: did you do the three-minute test, and did you write the line listing what you
          couldn't verify.
        </li>
        <li>It shows you the scorecard. Hold back any line you like.</li>
        <li>
          If you want to send it, it gives you a link to this site. Open it, check the card one more time, and click Send. It
          can't send anything itself.
        </li>
      </ol>

      <h2>What the grader can't do</h2>
      <ul className="steps">
        <li>Send a scorecard. Only you can, from the review page.</li>
        <li>Put words from your work in a scorecard. Every line is a number, a date, a fixed category, or yes or no.</li>
        <li>Use the internet. Its receipt counts network attempts, and the review page tells you if there were any.</li>
        <li>Name your skills. It records them by slot (voice, brand, research), so a skill called after a client stays private.</li>
      </ul>
      <p className="fineprint">
        Its receipt, with every file it opened, stays in your folder. The scorecard carries only the counts.
      </p>
    </main>
  );
}
