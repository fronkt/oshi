import "server-only";
import { db } from "./db";

/**
 * Short-TTL serving cache over AniList reads (`anilist_cache` table).
 * This is the ONLY place AniList responses touch the database — keyed, TTL'd,
 * evicted (ToS: cache, never mirror/hoard). It also stretches the degraded
 * 30 req/min per-token budget.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const { rows } = await db().query(
    `select payload from anilist_cache where key = $1 and expires_at > now()`,
    [key],
  );
  if (rows[0]) return rows[0].payload as T;

  const value = await fetcher();
  await db().query(
    `insert into anilist_cache (key, payload, fetched_at, expires_at)
     values ($1, $2, now(), now() + make_interval(secs => $3))
     on conflict (key) do update
       set payload = excluded.payload,
           fetched_at = excluded.fetched_at,
           expires_at = excluded.expires_at`,
    [key, JSON.stringify(value), ttlSeconds],
  );

  // opportunistic eviction sweep (~5% of writes) — keeps the cache a cache
  if (Math.random() < 0.05) {
    db()
      .query(`delete from anilist_cache where expires_at < now()`)
      .catch(() => {});
  }
  return value;
}

/** Drop cache entries whose key starts with the prefix (after writes). */
export async function bustCache(prefix: string): Promise<void> {
  await db().query(`delete from anilist_cache where key like $1 || '%'`, [prefix]);
}
