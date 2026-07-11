import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

export const isDbConfigured = !!databaseUrl;

let _pool: Pool | null = null;

if (isDbConfigured) {
  const globalForDb = globalThis as typeof globalThis & {
    __arenaNextJsPostgresqlPool?: Pool;
  };

  _pool =
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = _pool;
  }
}

export const pool = _pool!;
export const db = _pool ? drizzle(_pool) : null!;
