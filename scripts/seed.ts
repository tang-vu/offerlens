import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { createDemoReport } from "../src/domain/demo";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required to seed demo data.");
const sql = postgres(url, { max: 1 });
try {
  const report = { ...(await createDemoReport()), id: randomUUID() };
  const ownerHash = "seeded-demo-not-browser-accessible";
  await sql`insert into analyses (id, owner_hash, idempotency_key, input_hash, methodology_version, report, expires_at)
    values (${report.id}, ${ownerHash}, ${`seed-${report.id}`}, ${"synthetic-demo"}, ${report.methodologyVersion}, ${sql.json(report)}, now() + interval '30 days')
    on conflict do nothing`;
  process.stdout.write(`Seeded synthetic report ${report.id}\n`);
} finally {
  await sql.end();
}
