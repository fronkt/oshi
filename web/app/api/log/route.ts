import { NextResponse } from "next/server";
import { sessionUser } from "@/lib/server/session";
import { saveProgress, type MediaListStatus } from "@/lib/server/anilist";
import { bustCache } from "@/lib/server/cached";

export const runtime = "nodejs";

const STATUSES: MediaListStatus[] = [
  "CURRENT",
  "PLANNING",
  "COMPLETED",
  "DROPPED",
  "PAUSED",
  "REPEATING",
];

/**
 * Quick-log from the web (the signal wedge): progress bump / status change via
 * SaveMediaListEntry with the viewer's own token. Token never leaves the server.
 */
export async function POST(req: Request) {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const token = user.anilistToken();
  if (!token) {
    return NextResponse.json({ ok: false, error: "no_anilist_token" }, { status: 409 });
  }

  let mediaId: number;
  let progress: number | undefined;
  let status: MediaListStatus | undefined;
  try {
    const body = await req.json();
    mediaId = Number(body.mediaId);
    if (body.progress !== undefined) progress = Number(body.progress);
    if (body.status !== undefined) status = String(body.status) as MediaListStatus;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (
    !Number.isSafeInteger(mediaId) ||
    (progress !== undefined && (!Number.isSafeInteger(progress) || progress < 0)) ||
    (status !== undefined && !STATUSES.includes(status)) ||
    (progress === undefined && status === undefined)
  ) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  try {
    const entry = await saveProgress(token, { mediaId, progress, status });
    // the user's own list + feed just changed — drop their stale cache rows
    await bustCache(`list:${user.anilistId}:`);
    await bustCache(`feed:${user.id}:`);
    return NextResponse.json({ ok: true, entry });
  } catch (e) {
    console.error("[api/log]", e);
    return NextResponse.json({ ok: false, error: "anilist_failed" }, { status: 502 });
  }
}
