"use client";
import { useEffect, useState } from "react";

// Header items that depend on being signed in. Asks the server only "am I signed in?".
export function AccountNav({ part }: { part: "lead" | "button" }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    fetch("/api/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => setSignedIn(!!j.signedIn))
      .catch(() => setSignedIn(false));
  }, []);

  if (part === "lead")
    return signedIn ? (
      <>
        <a href="/your-ai">Your AI</a>
        <a href="/workbook">Vault</a>
      </>
    ) : (
      <a href="/#do">What are you trying to do?</a>
    );

  return signedIn ? (
    <form method="post" action="/api/auth/signout">
      <button className="btn-quiet" type="submit">
        Sign out
      </button>
    </form>
  ) : (
    <a className="btn-quiet" href="/login">
      Sign in
    </a>
  );
}
