// While the person signs in, the card waits in this browser (it never goes to a server).
// localStorage, not sessionStorage, because the sign-in link usually opens in a new tab.
// It holds only the typed card, and expires after an hour.
const KEY = "pendingReview";
const TTL_MS = 60 * 60 * 1000;

export function keepPending(fragment: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ fragment, at: Date.now() }));
  } catch {
    // storage blocked (private window): the card just won't wait
  }
}

export function peekPending(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { fragment, at } = JSON.parse(raw);
    if (typeof fragment !== "string" || Date.now() - at > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return fragment;
  } catch {
    return null;
  }
}

export function clearPending() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
