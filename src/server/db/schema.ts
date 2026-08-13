import { index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const analyses = pgTable(
  "analyses",
  {
    id: text("id").primaryKey(),
    ownerHash: text("owner_hash").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    inputHash: text("input_hash").notNull(),
    methodologyVersion: text("methodology_version").notNull(),
    report: jsonb("report").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("analyses_owner_idempotency_idx").on(table.ownerHash, table.idempotencyKey),
    index("analyses_expires_at_idx").on(table.expiresAt),
  ],
);
