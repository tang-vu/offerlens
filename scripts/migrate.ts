import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required to run migrations.");
const sql = postgres(url, { max: 1 });
try {
  const migration = await readFile(path.resolve("drizzle/0000_initial.sql"), "utf8");
  await sql.unsafe(migration);
  process.stdout.write("Applied drizzle/0000_initial.sql\n");
} finally {
  await sql.end();
}
