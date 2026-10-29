"use client";
import { useEffect, useState } from "react";

// One "am I signed in?" question per page load, shared by the header and the homepage tiles.
let answer: Promise<boolean> | null = null;
export function signedIn(): Promise<boolean> {
  answer ??= fetch("/api/me", { credentials: "same-origin" })
    .then((r) => r.json())
    .then((j) => !!j.signedIn)
    .catch(() => false);
  return answer;
}

export function useSignedIn(): boolean | null {
  const [v, setV] = useState<boolean | null>(null);
  useEffect(() => {
    signedIn().then(setV);
  }, []);
  return v;
}
