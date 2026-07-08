import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { encryptToken } from "@/lib/server/crypto";
import { authConfigured, exchangeCode, viewer } from "@/lib/server/anilist";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/server/session";

export const runtime = "nodejs";

/**
 * AniList OAuth callback: code -> tokens -> Viewer -> upsert users row
 * (token AES-GCM encrypted at rest) -> mint Oshi session -> /app.
 * First sign-in IS sign-up; there is no separate registration.
 */
export async function GET(req: NextRequest) {
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/?auth=${reason}`, req.nextUrl.origin));

  if (!authConfigured()) return fail("soon");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const nonce = req.cookies.get("oshi_oauth_state")?.value;

  // login-CSRF guard: the browser must carry the nonce we set at /login, and
  // if AniList echoed state back it must match
  if (!code || !nonce || (state && state !== nonce)) return fail("failed");

  try {
    const tokens = await exchangeCode(code);
    const me = await viewer(tokens.access_token);

    const { rows } = await db().query(
      `insert into users (anilist_id, anilist_name, avatar_url,
                          anilist_token_enc, anilist_refresh_enc, token_expires_at, last_seen_at)
       values ($1, $2, $3, $4, $5, now() + make_interval(secs => $6), now())
       on conflict (anilist_id) do update
         set anilist_name = excluded.anilist_name,
             avatar_url = excluded.avatar_url,
             anilist_token_enc = excluded.anilist_token_enc,
             anilist_refresh_enc = excluded.anilist_refresh_enc,
             token_expires_at = excluded.token_expires_at,
             last_seen_at = now()
       returning id`,
      [
        me.id,
        me.name,
        me.avatar.large,
        encryptToken(tokens.access_token),
        tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
        tokens.expires_in ?? 31_536_000,
      ],
    );

    const session = await createSession(rows[0].id);
    const res = NextResponse.redirect(new URL("/app", req.nextUrl.origin));
    res.cookies.set(SESSION_COOKIE, session, sessionCookieOptions);
    res.cookies.delete("oshi_oauth_state");
    return res;
  } catch (e) {
    console.error("[auth/callback]", e);
    return fail("failed");
  }
}
