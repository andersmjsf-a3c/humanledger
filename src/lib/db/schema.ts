import { pgTable, pgEnum, uuid, text, timestamp, date, jsonb, integer, index } from "drizzle-orm/pg-core";

// Rule: no column holds text a person wrote. Text columns are allowlisted in
// tests/column-guard.test.ts; adding one fails the build until someone justifies it there.

export const cardKind = pgEnum("card_kind", ["deliverable", "skill_retest", "worksheet"]);
export const serviceAgent = pgEnum("service_agent", ["coach", "team_reporter"]);
export const receiptAction = pgEnum("receipt_action", ["recommendation_written", "aggregate_written"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Session ids are stored as SHA-256 hashes; the raw value lives only in the person's cookie.
export const sessions = pgTable("sessions", {
  idHash: text("id_hash").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

// One-time sign-in links, also stored only as hashes.
export const loginTokens = pgTable("login_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  email: text("email").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

// The ledger. `card` is validated against scorecard.schema.json before insert: typed values only.
export const scorecards = pgTable(
  "scorecards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: cardKind("kind").notNull(),
    schemaVersion: text("schema_version").notNull(),
    gradedOn: date("graded_on").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    card: jsonb("card").notNull(),
  },
  (t) => [index("scorecards_user_idx").on(t.userId, t.receivedAt)],
);

// Service-maintained list of model releases; feeds the model_release category.
export const releaseRegistry = pgTable("release_registry", {
  value: text("value").primaryKey(),
  vendor: text("vendor").notNull(),
  releasedOn: date("released_on").notNull(),
});

// Receipts for service-side agents. What a buyer's security team audits. Empty until the coach ships.
export const agentReceipts = pgTable("agent_receipts", {
  id: uuid("id").primaryKey().defaultRandom(),
  agent: serviceAgent("agent").notNull(),
  credentialId: text("credential_id").notNull(),
  action: receiptAction("action").notNull(),
  cardsRead: integer("cards_read").notNull(),
  writtenAt: timestamp("written_at", { withTimezone: true }).notNull().defaultNow(),
});
