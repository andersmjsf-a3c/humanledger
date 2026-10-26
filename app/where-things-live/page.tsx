import { WHERE, whereIsChecked } from "@/service/reference";

export const metadata = { title: "Where things live", description: "Where each setting and feature is today, dated." };

export default function WhereThingsLive() {
  const checked = whereIsChecked();
  return (
    <main>
      <h1>Where things live</h1>
      <p className="lede">
        As of today. This page will be wrong first, so we keep it current. The habits don&apos;t move. Only the buttons do. When a
        release lands, this page is what we update first, with the date.
      </p>
      {checked ? (
        <>
          <p className="meta">Last checked {WHERE.lastChecked}.</p>
          <table className="cardtable">
            <tbody>
              {WHERE.rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  <td>
                    {r.where}
                    {r.was && <span className="meta"> (was: {r.was})</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div className="card">
          <h3>First check in progress</h3>
          <p>
            Nothing is listed until it&apos;s been checked against today&apos;s screens and dated. A page like this that goes stale
            is worse than none. Until then, ask your AI directly: &quot;Where do I turn memory on or off, and where do I upload a
            skill, as of today?&quot; and check its answer against what you see.
          </p>
        </div>
      )}
    </main>
  );
}
