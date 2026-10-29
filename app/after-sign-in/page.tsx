"use client";
import { useEffect } from "react";
import { peekPending } from "@/review/pending";
import { takeReturn } from "@/account/returnTo";

// Back from the sign-in link: return to the scorecard that was waiting, else the page they signed in from, else Your AI.
// The waiting card is cleared when it's sent or discarded on /review.
let sent = false; // the effect can run twice in development; redirect once

export default function AfterSignIn() {
  useEffect(() => {
    if (sent) return;
    sent = true;
    const pending = peekPending();
    window.location.replace(pending ? `/review#${pending}` : (takeReturn() ?? "/your-ai"));
  }, []);
  return (
    <main>
      <p>Signed in. One moment…</p>
    </main>
  );
}
