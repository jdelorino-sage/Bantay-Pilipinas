import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { getPool, hasDatabaseUrl } from "./client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MIGRATIONS = ["001_initial.sql"];

export async function runMigrations(): Promise<void> {
  if (!hasDatabaseUrl()) {
    console.log("[migrate] No DATABASE_URL set, skipping migrations");
    return;
  }

  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const applied = await pool.query("SELECT name FROM _migrations ORDER BY id");
  const appliedNames = new Set(applied.rows.map((r: { name: string }) => r.name));

  for (const migration of MIGRATIONS) {
    if (appliedNames.has(migration)) {
      console.log(`[migrate] Skipping ${migration} (already applied)`);
      continue;
    }

    const sql = readFileSync(join(__dirname, "migrations", migration), "utf-8");
    await pool.query(sql);
    await pool.query("INSERT INTO _migrations (name) VALUES ($1)", [migration]);
    console.log(`[migrate] Applied ${migration}`);
  }

  console.log("[migrate] Migrations complete");
}

// CLI entrypoint: run migrations and close pool
if (process.argv[1] && process.argv[1].includes("migrate")) {
  runMigrations()
    .then(async () => {
      await getPool().end();
      console.log("[migrate] Done");
    })
    .catch((err) => {
      console.error("[migrate] Failed:", err);
      process.exit(1);
    });
}
