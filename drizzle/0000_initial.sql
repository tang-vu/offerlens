CREATE TABLE IF NOT EXISTS "analyses" (
  "id" text PRIMARY KEY NOT NULL,
  "owner_hash" text NOT NULL,
  "idempotency_key" text NOT NULL,
  "input_hash" text NOT NULL,
  "methodology_version" text NOT NULL,
  "report" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "analyses_owner_idempotency_idx" ON "analyses" USING btree ("owner_hash", "idempotency_key");
CREATE INDEX IF NOT EXISTS "analyses_expires_at_idx" ON "analyses" USING btree ("expires_at");
