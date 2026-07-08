import "server-only";
import { cookies } from "next/headers";
import { db, dbConfigured } from "./db";
import { decryptToken, randomToken, sha256hex } from "./crypto";

export const SESSION_COOKIE = "oshi_session";
export const SESSION_DAYS = 30;

export type SessionUser = {
  id: string;
  anilistId: number;
  anilistName: string;
  avatarUrl: string | null;
  /** Decrypts the stored AniList token; null if the user has none on file. */
  anilistToken: () => string | null;
};

/** Mint a session row and return the opaque token (only its sha256 is stored). */
export async function createSession(userId: string): Promise<string> {
  const token = randomToken();
  await db().query(
    `insert into oshi_sessions (user_id, token_hash, expires_at)
     values ($1, $2, now() + make_interval(days => $3))`,
    [userId, sha256hex(token), SESSION_DAYS],
  );
  return token;
}

/** The logged-in user for the current request, or null. */
export async function sessionUser(): Promise<SessionUser | null> {
  if (!dbConfigured()) return null;
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { rows } = await db().query(
    `select u.id, u.anilist_id, u.anilist_name, u.avatar_url, u.anilist_token_enc
       from oshi_sessions s
       join users u on u.id = s.user_id
      where s.token_hash = $1 and s.revoked_at is null and s.expires_at > now()`,
    [sha256hex(token)],
  );
  const row = rows[0];
  if (!row) return null;

  // touch last_seen at most opportunistically; never block the request on it
  db()
    .query(`update users set last_seen_at = now() where id = $1`, [row.id])
    .catch(() => {});

  return {
    id: row.id,
    anilistId: row.anilist_id,
    anilistName: row.anilist_name,
    avatarUrl: row.avatar_url,
    anilistToken: () =>
      row.anilist_token_enc ? decryptToken(row.anilist_token_enc) : null,
  };
}

/** Revoke the current session server-side (cookie clearing is the caller's job). */
export async function revokeCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token || !dbConfigured()) return;
  await db().query(
    `update oshi_sessions set revoked_at = now() where token_hash = $1`,
    [sha256hex(token)],
  );
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DAYS * 24 * 60 * 60,
};
