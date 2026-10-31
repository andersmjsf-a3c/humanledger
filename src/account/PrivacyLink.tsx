"use client";
import { useSignedIn } from "./useSignedIn";

// Before sign-in nothing can leave the vault; after, only the scorecards the person sends (brand, Oct 30 2026).
export function PrivacyLink() {
  const signedIn = useSignedIn();
  // Until we know (first paint), no parenthetical rather than a claim that might be wrong for this person.
  const note = signedIn === null ? "" : signedIn ? " (scores only)" : " (nothing)";
  return <a href="/privacy">Privacy: what leaves your vault{note}</a>;
}
