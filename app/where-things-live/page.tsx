import { WHERE, whereIsChecked } from "@/service/reference";

export const metadata = { title: "Where things live", description: "Where each setting and feature is today, dated." };

export default function WhereThingsLive() {
  const checked = whereIsChecked();
  return (
    <main className="where">
      <h1>Where things live</h1>
      {checked ? (
        <>
          <p className="lede">Last checked {WHERE.lastChecked}. {WHERE.intro}</p>
          {WHERE.rows.map((r) => (
            <section key={r.id} id={r.id} className="where-row">
              <h2>{r.thing}</h2>
              <p>{r.whereToday}</p>
              {r.wasCalled && (
                <p className="meta">
                  <strong>If an older article says otherwise:</strong> {r.wasCalled}
                </p>
              )}
              {r.plans && (
                <p className="meta">
                  <strong>Plans:</strong> {r.plans}
                </p>
              )}
              <p className="meta">
                {r.lastChanged && <>Last changed {r.lastChanged}. </>}
                {r.source && (
                  <a href={r.source} rel="noreferrer">
                    Source
                  </a>
                )}
              </p>
            </section>
          ))}
          {WHERE.checkedAgainst && <p className="fineprint">Checked against: {WHERE.checkedAgainst}.</p>}
        </>
      ) : (
        <div className="card">
          <h3>First check in progress</h3>
          <p>Nothing is listed until it&apos;s been checked against today&apos;s screens and dated. A page like this that goes stale is worse than none.</p>
        </div>
      )}
    </main>
  );
}
