import "server-only";
import { Pool } from "pg";

/**
 * Postgres access for the web product. Connects as the least-privilege
 * `oshi_api` role (see supabase/migrations/0003_web_product.sql) through the
 * Supabase transaction pooler — NOT the service role, and never from the client.
 *
 * DATABASE_URL is server-env only (Vercel env / .env.local). The pool is cached
 * on globalThis so dev hot-reload and serverless warm invocations reuse it.
 */

declare global {
  // eslint-disable-next-line no-var
  var __oshiPool: Pool | undefined;
}

export function dbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function db(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (!globalThis.__oshiPool) {
    const local = /localhost|127\.0\.0\.1/.test(url);
    globalThis.__oshiPool = new Pool({
      connectionString: url,
      // serverless: keep the per-instance pool tiny; the supavisor transaction
      // pooler (port 6543) does the real multiplexing
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
      ssl: local ? undefined : { rejectUnauthorized: false },
    });
  }
  return globalThis.__oshiPool;
}
