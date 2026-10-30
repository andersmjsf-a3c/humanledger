"use client";
import { rememberReturn } from "./returnTo";
import { useSignedIn } from "./useSignedIn";

// Header items that depend on being signed in. Asks the server only "am I signed in?".
export function AccountNav({ part }: { part: "lead" | "button" }) {
  const signedIn = useSignedIn();

  if (part === "lead")
    return signedIn ? (
      <>
        <a href="/your-ai">Your AI</a>
        <a href="/workbook">Vault</a>
      </>
    ) : null;

  return signedIn ? (
    <form method="post" action="/api/auth/signout">
      <button className="btn-quiet" type="submit">
        Sign out
      </button>
    </form>
  ) : (
    <a className="btn-quiet" href="/login" onClick={() => rememberReturn(window.location.pathname + window.location.hash)}>
      Sign in
    </a>
  );
}
