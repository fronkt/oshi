import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { sessionUser } from "@/lib/server/session";
import { REACTION_EMOJI } from "@/lib/emoji";

export const runtime = "nodejs";

/**
 * Toggle an emoji reaction on a feed activity (SPEC decision 4: react-to-anyone).
 * The activity is referenced by AniList id — a pointer, never stored content.
 * Reacting to someone not on Oshi stores the reaction as `pending`; they see it
 * the moment they join (the invite hook).
 */
export async function POST(req: Request) {
  const user = await sessionUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  let activityId: number, targetAnilistId: number, emoji: string;
  try {
    const body = await req.json();
    activityId = Number(body.activityId);
    targetAnilistId = Number(body.targetAnilistId);
    emoji = String(body.emoji);
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  if (
    !Number.isSafeInteger(activityId) ||
    !Number.isSafeInteger(targetAnilistId) ||
    !(REACTION_EMOJI as readonly string[]).includes(emoji)
  ) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // toggle: same actor + activity + emoji removes the reaction
  const removed = await db().query(
    `delete from reactions
      where actor_id = $1 and anilist_activity_id = $2 and emoji = $3
      returning id`,
    [user.id, activityId, emoji],
  );
  if (removed.rowCount) return NextResponse.json({ ok: true, state: "removed" });

  const target = await db().query(`select 1 from users where anilist_id = $1`, [
    targetAnilistId,
  ]);
  const status = target.rowCount ? "sent" : "pending";

  await db().query(
    `insert into reactions (actor_id, anilist_activity_id, target_anilist_id, emoji, status)
     values ($1, $2, $3, $4, $5)`,
    [user.id, activityId, targetAnilistId, emoji, status],
  );
  return NextResponse.json({ ok: true, state: status });
}
