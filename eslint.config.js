import js from "@eslint/js";
import tseslint from "typescript-eslint";

const NETWORK_GLOBALS = ["fetch", "XMLHttpRequest", "WebSocket", "EventSource"].map((name) => ({
  name,
  message: "The vault never touches the network. Content stays on the person's side.",
}));

export default tseslint.config(
  { ignores: [".next/**", "node_modules/**", "drizzle/**", "next-env.d.ts"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "error",
    },
  },
  // Only the logger and the dev-mode email fallback may print.
  { files: ["src/lib/log.ts", "src/lib/auth/email.ts"], rules: { "no-console": "off" } },
  { files: ["tests/**"], rules: { "no-console": "off" } },
  // Privacy guard 4: the vault can't make network calls.
  {
    files: ["src/vault/**"],
    rules: {
      "no-restricted-globals": ["error", ...NETWORK_GLOBALS],
      "no-restricted-properties": [
        "error",
        { object: "navigator", property: "sendBeacon", message: "The vault never touches the network." },
        { object: "window", property: "fetch", message: "The vault never touches the network." },
        { object: "globalThis", property: "fetch", message: "The vault never touches the network." },
      ],
      "no-restricted-imports": [
        "error",
        { patterns: ["node:http*", "http", "https", "axios", "ky", "undici", "resend", "@/lib/db/*", "postgres"] },
      ],
    },
  },
);
