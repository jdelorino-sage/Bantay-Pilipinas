import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL || process.env.NETLIFY_DATABASE_URL_UNPOOLED;
}

export function hasDatabaseUrl(): boolean {
  return !!getDatabaseUrl();
}

export function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = getDatabaseUrl();
    if (!connectionString) {
      throw new Error("DATABASE_URL or NETLIFY_DATABASE_URL environment variable is required");
    }
    pool = new Pool({
      connectionString,
      ssl: true,
      max: 10,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}

export async function query(text: string, params?: unknown[]): Promise<pg.QueryResult> {
  return getPool().query(text, params);
}

export async function testConnection(): Promise<boolean> {
  if (!hasDatabaseUrl()) return false;
  try {
    const result = await query("SELECT 1");
    return result.rowCount === 1;
  } catch {
    return false;
  }
}
