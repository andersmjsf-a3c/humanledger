// Review links carry the card after the "#": browsers never send that part to a server.
// Format: https://<host>/review#v1.<base64url(JSON)>

export function encodeCard(card: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(card));
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return "v1." + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeCard(fragment: string): unknown {
  const raw = fragment.replace(/^#/, "");
  if (!raw.startsWith("v1.")) throw new Error("unknown review link version");
  const b64 = raw.slice(3).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
}
