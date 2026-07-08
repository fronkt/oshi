import "server-only";
import { db } from "./db";
import type { ReactionCount } from "@/components/product/reaction-bar";

/** Oshi reactions for a batch of AniList activity ids, grouped per activity. */
export async function reactionsFor(
  viewerId: string,
  activityIds: number[],
): Promise<Map<number, ReactionCount[]>> {
  const map = new Map<number, ReactionCount[]>();
  if (!activityIds.length) return map;
  const { rows } = await db().query(
    `select anilist_activity_id as id, emoji,
            count(*)::int as n,
            bool_or(actor_id = $1) as mine
       from reactions
      where anilist_activity_id = any($2::bigint[]) and emoji is not null
      group by 1, 2`,
    [viewerId, activityIds],
  );
  for (const r of rows) {
    const list = map.get(Number(r.id)) ?? [];
    list.push({ emoji: r.emoji, n: r.n, mine: r.mine });
    map.set(Number(r.id), list);
  }
  return map;
}
