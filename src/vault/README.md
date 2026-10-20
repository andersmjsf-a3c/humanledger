# Vault (browser side)

Everything in this folder handles the person's content: worksheet answers, generated skill
files, linter input. It runs in the browser only and must never make a network call.
The build enforces this twice: an ESLint rule bans fetch, XMLHttpRequest, WebSocket,
EventSource, sendBeacon and network imports here, and tests/vault-no-network.test.ts scans
the folder. Saving happens to the browser (IndexedDB) and to a folder the person picks.
