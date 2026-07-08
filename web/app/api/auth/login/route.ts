import { NextRequest, NextResponse } from "next/server";
import { randomToken } from "@/lib/server/crypto";
import { authConfigured, authorizeUrl } from "@/lib/server/anilist";

export const runtime = "nodejs";

/**
 * Kicks off "Sign in with AniList" (authorization-code grant).
 * A nonce cookie guards against login-CSRF; the callback requires it and, if
 * AniList echoes `state`, checks it too.
 */
export function GET(req: NextRequest) {
  if (!authConfigured()) {
    return NextResponse.redirect(new URL("/?auth=soon", req.nextUrl.origin));
  }
  const state = randomToken();
  const res = NextResponse.redirect(authorizeUrl(state));
  res.cookies.set("oshi_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
