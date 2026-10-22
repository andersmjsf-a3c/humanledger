"use client";
import { useEffect } from "react";
import { peekPending } from "@/review/pending";

// Back from the sign-in link: return to the scorecard that was waiting, or to history.
// The waiting card is cleared when it's sent or discarded on /review.
export default function AfterSignIn() {
  useEffect(() => {
    const pending = peekPending();
    window.location.replace(pending ? `/review#${pending}` : "/history");
  }, []);
  return (
    <main>
      <p>Signed in. One moment…</p>
    </main>
  );
}
