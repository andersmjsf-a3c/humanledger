import { cookies } from "next/headers";
import { SESSION_COOKIE, userIdForSession } from "@/lib/auth/session";
import { historyFor, worksheetStatus } from "@/lib/history";
import { cardTitle, receiptWarnings, rows } from "@/cards/labels";
import { WORKSHEETS } from "@/worksheets";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your history" };

const KIND_TITLE: Record<string, string> = { deliverable: "Draft checks and graded work", skill_retest: "Skill re-tests" };

export default async function History() {
  const userId = await userIdForSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!userId)
    return (
      <main>
        <h1>Your history</h1>
        <p>
          <a href="/login">Sign in</a> to see the scorecards you've sent.
        </p>
      </main>
    );

  const history = await historyFor(userId);
  const status = worksheetStatus(history);
  const others = (kind: string) => history.filter((r) => r.kind === kind);

  return (
    <main>
      <h1>Your history</h1>
      <p className="lede">Every scorecard you've sent, and nothing else. Your answers and drafts stay on your device.</p>
      {history.length === 0 && <p>Nothing sent yet. Finish a worksheet or check a draft, then review and send its scorecard.</p>}

      <h2>Worksheets</h2>
      <table className="cardtable">
        <tbody>
          {WORKSHEETS.map((w) => (
            <tr key={w.id}>
              <th scope="row">
                <a href={`/workbook/${w.id}`}>
                  {w.id}. {w.title}
                </a>
              </th>
              <td>{status[w.id] ? `${status[w.id].status === "revisited_v2" ? "Revisited" : "Completed"} ${status[w.id].gradedOn}` : <span className="meta">Not sent</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {(["deliverable", "skill_retest"] as const).map((kind) =>
        others(kind).length ? (
          <section key={kind}>
            <h2>{KIND_TITLE[kind]}</h2>
            {others(kind).map((r) => (
              <details key={r.id}>
                <summary>
                  {r.gradedOn} · {cardTitle(r.card)}
                </summary>
                <table className="cardtable">
                  <tbody>
                    {rows(r.card).map((x) => (
                      <tr key={x.key}>
                        <th scope="row">{x.label}</th>
                        <td>{x.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {receiptWarnings(r.card).map((w) => (
                  <p key={w} className="message">
                    {w}
                  </p>
                ))}
              </details>
            ))}
          </section>
        ) : null,
      )}
    </main>
  );
}
