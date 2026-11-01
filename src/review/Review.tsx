"use client";
import { useEffect, useMemo, useState } from "react";
import { decodeCard, encodeCard } from "@/lib/scorecard/encode";
import { checkCard } from "@/lib/scorecard/validate";
import { holdBack, requiredKeys, type Card } from "@/cards/build";
import { receiptWarnings, rows } from "@/cards/labels";
import { getStore } from "@/vault/ui/useVault";
import { clearPending, keepPending, peekPending } from "./pending";

type State = { kind: "loading" } | { kind: "none" } | { kind: "invalid"; errors: string[] } | { kind: "ready"; card: Card };

// The only page that can send a scorecard, and only when the person clicks Send.
// The card arrives in the part of the link after "#", which browsers never send to a server.
export function Review() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [held, setHeld] = useState<string[]>([]);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    const fragment = window.location.hash.replace(/^#/, "") || peekPending() || "";
    if (!fragment) return setState({ kind: "none" });
    try {
      const card = decodeCard(fragment) as Card;
      const v = checkCard(card);
      setState(v.ok ? { kind: "ready", card } : { kind: "invalid", errors: v.errors });
      if (v.ok && !window.location.hash) window.history.replaceState(null, "", `#${fragment}`);
    } catch {
      setState({ kind: "invalid", errors: ["This link doesn't hold a sounding."] });
    }
    fetch("/api/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => setSignedIn(!!j.signedIn))
      .catch(() => setSignedIn(false));
  }, []);

  const final = useMemo(() => (state.kind === "ready" ? holdBack(state.card, held) : null), [state, held]);

  async function send() {
    if (!final) return;
    setStatus("sending");
    try {
      const { token } = await (await fetch("/api/csrf", { credentials: "same-origin" })).json();
      const res = await fetch("/api/scorecards", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json", "x-csrf-token": token },
        body: JSON.stringify(final),
      });
      if (res.status !== 201) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error === "not_signed_in" ? "Your sign-in has expired. Sign in again; your sounding will wait." : `Not sent (${j.error ?? res.status}).`);
      }
      if (final.kind === "worksheet") await getStore().markCompleted(String(final.worksheet_id));
      clearPending();
      window.history.replaceState(null, "", "/review");
      setStatus("sent");
    } catch (e: any) {
      setError(e?.message ?? "Not sent.");
      setStatus("error");
    }
  }

  if (state.kind === "loading") return <p>Reading the sounding in this link…</p>;
  if (state.kind === "none") return <p>No sounding here. Soundings come from finishing a worksheet, the draft checker, or the grading keep you run in Claude.</p>;
  if (state.kind === "invalid")
    return (
      <>
        <p>This link doesn't hold a sounding we can accept, so nothing can be sent from it.</p>
        <ul className="flags">{state.errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}</ul>
      </>
    );

  if (status === "sent")
    return (
      <>
        <p className="saved">Sent. It's in your history now.</p>
        <p>
          <a href="/history">See your history</a>
        </p>
      </>
    );

  const req = new Set(requiredKeys(state.card));
  return (
    <>
      <p className="lede">This is everything that would be sent. Untick any line to hold it back. Nothing goes until you click Send.</p>
      <table className="cardtable">
        <tbody>
          {rows(state.card).map((r) => (
            <tr key={r.key} className={held.includes(r.key) ? "held" : ""}>
              <td className="keep">
                {req.has(r.key) ? (
                  <span title="Every sounding has this line" className="meta">always</span>
                ) : (
                  <input
                    type="checkbox"
                    aria-label={`Send ${r.label}`}
                    checked={!held.includes(r.key)}
                    onChange={(e) => setHeld((h) => (e.target.checked ? h.filter((k) => k !== r.key) : [...h, r.key]))}
                  />
                )}
              </td>
              <th scope="row">{r.label}</th>
              <td>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {receiptWarnings(state.card).map((w) => (
        <p key={w} className="message">
          Check before sending: {w}
        </p>
      ))}
      <p className="meta">Not in here: any words from your work, file names, or names of people or companies.</p>
      <details>
        <summary>The exact data</summary>
        <pre className="preview">{JSON.stringify(final, null, 2)}</pre>
      </details>

      {signedIn === false ? (
        <p>
          <a
            className="primarylink"
            href="/login"
            onClick={() => final && keepPending(encodeCard(final))}
          >
            Sign in to send
          </a>{" "}
          <span className="meta">Your sounding waits in this tab while you do.</span>
        </p>
      ) : (
        <div className="actions">
          <button className="primary" onClick={send} disabled={status === "sending" || signedIn === null}>
            {status === "sending" ? "Sending…" : "Send"}
          </button>
          <a href="/" onClick={() => clearPending()}>
            Discard
          </a>
        </div>
      )}
      {status === "error" && <p className="message">{error}</p>}
    </>
  );
}
