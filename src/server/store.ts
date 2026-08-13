import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { analyses } from "@/server/db/schema";
import { ReportSchema, type Report } from "@/domain/schemas";

interface Stored {
  ownerHash: string;
  idempotencyKey: string;
  inputHash: string;
  report: Report;
  expiresAt: Date;
}
const memory = new Map<string, Stored>();
let client: ReturnType<typeof postgres> | undefined;
let database: ReturnType<typeof drizzle> | undefined;

function getDb() {
  if (!process.env.DATABASE_URL) return undefined;
  if (!database) {
    client = postgres(process.env.DATABASE_URL, { max: 5, idle_timeout: 20, connect_timeout: 5 });
    database = drizzle(client);
  }
  return database;
}

export function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function inputHash(value: unknown) {
  return hashValue(JSON.stringify(value));
}

export interface OwnerContext {
  token: string;
  ownerHash: string;
  isNew: boolean;
}

export function ownerContext(request: Request): OwnerContext {
  const cookies = request.headers.get("cookie") ?? "";
  const match = cookies.match(/(?:^|;\s*)offerlens_session=([a-f0-9]{64})(?:;|$)/);
  const token = match?.[1] ?? randomBytes(32).toString("hex");
  return { token, ownerHash: hashValue(token), isNew: !match };
}

export function attachOwnerCookie(response: Response, owner: OwnerContext) {
  if (owner.isNew) {
    response.headers.append(
      "Set-Cookie",
      `offerlens_session=${owner.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
    );
  }
  return response;
}

function expiry() {
  const parsed = Number(process.env.ANALYSIS_RETENTION_DAYS ?? 30);
  const days = Number.isFinite(parsed) ? Math.max(1, Math.min(365, parsed)) : 30;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1_000);
}

export async function saveReport(
  ownerHash: string,
  idempotencyKey: string,
  hash: string,
  report: Report,
) {
  const db = getDb();
  if (!db) {
    const duplicate = [...memory.values()].find(
      (item) => item.ownerHash === ownerHash && item.idempotencyKey === idempotencyKey,
    );
    if (duplicate) {
      if (duplicate.inputHash !== hash)
        throw new Error("Idempotency key was already used with different inputs.");
      return duplicate.report;
    }
    memory.set(report.id, {
      ownerHash,
      idempotencyKey,
      inputHash: hash,
      report,
      expiresAt: expiry(),
    });
    return report;
  }
  const existing = await db
    .select()
    .from(analyses)
    .where(and(eq(analyses.ownerHash, ownerHash), eq(analyses.idempotencyKey, idempotencyKey)))
    .limit(1);
  if (existing[0]) {
    if (existing[0].inputHash !== hash)
      throw new Error("Idempotency key was already used with different inputs.");
    return ReportSchema.parse(existing[0].report);
  }
  await db.insert(analyses).values({
    id: report.id,
    ownerHash,
    idempotencyKey,
    inputHash: hash,
    methodologyVersion: report.methodologyVersion,
    report,
    expiresAt: expiry(),
  });
  return report;
}

export async function findReport(ownerHash: string, id: string) {
  const db = getDb();
  if (!db) {
    const item = memory.get(id);
    if (!item || item.ownerHash !== ownerHash || item.expiresAt < new Date()) return undefined;
    return item.report;
  }
  const rows = await db
    .select()
    .from(analyses)
    .where(and(eq(analyses.id, id), eq(analyses.ownerHash, ownerHash)))
    .limit(1);
  return rows[0] && rows[0].expiresAt > new Date() ? ReportSchema.parse(rows[0].report) : undefined;
}

export async function deleteReport(ownerHash: string, id: string) {
  const db = getDb();
  if (!db) {
    const item = memory.get(id);
    if (!item || item.ownerHash !== ownerHash) return false;
    memory.delete(id);
    return true;
  }
  const rows = await db
    .delete(analyses)
    .where(and(eq(analyses.id, id), eq(analyses.ownerHash, ownerHash)))
    .returning({ id: analyses.id });
  return rows.length > 0;
}

export function resetMemoryStoreForTests() {
  memory.clear();
}
