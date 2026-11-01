import { CHANGES, WHERE, whereIsChecked } from "./reference";

// Homepage v3 (Oct 31 2026). Copy is from the keelsound-brand skill (messaging.md, homepage entry,
// and the v3 reference build it points to). Where things live and What changed come from their JSON.

// The vault switch from the vault-and-connector spec. Until the encrypted vault ships, the lines that
// describe it would be false on this site (a tester's files are in their browser, not stored with us),
// so the homepage shows the current, true lines from privacy-claims.md instead. Turning the vault on
// swaps in Mark's final lines unchanged.
export const VAULT_LIVE = process.env.NEXT_PUBLIC_VAULT_SYNC === "on";

export interface Never {
  title: string;
  body: string;
}

const NEVERS_FINAL: Never[] = [
  {
    title: "We never read your files.",
    body: "Not their contents, not their names, not which starter they came from, not a word you wrote. They're sealed on your device with AES-256 and stored with us as sealed bytes, so a lost laptop loses nothing and we still can't open anything.",
  },
  {
    title: "We never hold the key.",
    body: "It's made in your browser and locked by your passkey or your recovery code. Lose both and nobody can open your files, including us. That's what keeps them private.",
  },
  {
    title: "We never take your content through the connector.",
    body: "Add Keelsound in Claude and it can read our starters and your own sounding. It can't carry a sentence, a name, or a document to us, and it can't open your vault.",
  },
  {
    title: "We never send anything on your behalf.",
    body: "No tool here writes, posts, or sends. You see the draft, you decide, you send it yourself.",
  },
];

const NEVERS_NOW: Never[] = [
  {
    title: "We never read your files.",
    body: "Not their contents, not their names, not which starter they came from, not a word you wrote. Your vault is this browser and, if you choose, a folder on your computer. Nothing in it is sent to us.",
  },
  {
    title: "We never put a word of yours in your sounding.",
    body: "Your sounding is numbers, dates, categories, and yes/no. Never a sentence from a file. You see every line before it's sent, and you send it.",
  },
  NEVERS_FINAL[3],
];

export const BELOW = VAULT_LIVE
  ? {
      sub: "Your files are sealed on your device before they reach us. We never hold the key. The rest follows from that.",
      nevers: NEVERS_FINAL,
      canSee: [
        "That you have an account, and your email address",
        "Your sounding: counts of what's current, what's due, what passed",
        "How many files you have, roughly how big each is, and when each changed",
      ],
    }
  : {
      sub: "Your files stay on your device and never reach us. The rest follows from that.",
      nevers: NEVERS_NOW,
      canSee: [
        "That you have an account, and your email address",
        "Your sounding, the ones you send: counts of what's current, what's due, what passed",
      ],
    };

export const CANT_SEE = ["Anything you wrote", "Any file's name, or which starter it came from", "Anything in your conversations with your AI"];

export const EVERYTHING_YOURS = VAULT_LIVE
  ? "Save to my folder downloads every file you've made, in the format your AI reads, any time. Deleting your account deletes everything immediately."
  : "Save to my folder downloads every file you've made, in the format your AI reads, any time. Your vault is yours to keep or clear.";

// Reference-build estimate shown on each starter card.
export const MINUTES: Record<string, number> = {
  "write-like-me": 4,
  "check-the-facts": 3,
  "my-weekly-report": 3,
  "research-i-can-trust": 3,
  "who-my-company-is": 5,
  "my-posts": 3,
  "my-work-register": 4,
  "about-me": 2,
};

// The rows the homepage card features, with the reference build's short labels; the values come
// from the dated JSON, so they change when the page is re-checked. The full page has every row.
const FEATURED: { id: string; label: string }[] = [
  { id: "memory-toggle", label: "Memory" },
  { id: "skills-upload", label: "Add a keep to Claude" },
  { id: "model-selector", label: "Which model you're on" },
  { id: "retired-cowork", label: "Names that no longer appear" },
  { id: "duet", label: "A new name you may meet" },
];

// A row's "where it is today", short: whole sentences until there's enough to act on (about 90
// characters), never past 140 unless one sentence is longer on its own, never cut mid-sentence.
export function shortWhere(text: string, enough = 90, limit = 140): string {
  // A sentence ends at . ! ? followed by a space and a capital, a quote, or a digit (so "skill.md" stays whole).
  const sentences = text.match(/[\s\S]*?[.!?](?=\s+["\u201c(A-Z0-9+]|\s*$)/g)?.map((s) => s.trim()) ?? [text];
  let out = "";
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s;
    if (out && next.length > limit) break;
    out = next;
    if (out.length >= enough) break;
  }
  return out;
}

const day = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
const shortDay = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export const WHERE_CARD = {
  checked: whereIsChecked() && WHERE.lastChecked ? day(WHERE.lastChecked) : null,
  rows: FEATURED.flatMap(({ id, label }) => {
    const r = WHERE.rows.find((x) => x.id === id);
    return r ? [{ id, label, value: shortWhere(r.whereToday) }] : [];
  }),
};

export const CHANGED_CARD = CHANGES.slice(0, 4).map((e) => ({ id: e.id, date: shortDay(e.date), title: e.title }));
