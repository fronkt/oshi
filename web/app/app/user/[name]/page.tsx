import { notFound } from "next/navigation";
import { sessionUser } from "@/lib/server/session";
import { userByName, userActivity, type AniProfile } from "@/lib/server/anilist";
import { cached } from "@/lib/server/cached";
import { db } from "@/lib/server/db";
import { reactionsFor } from "@/lib/server/reactions";
import { ActivityCard } from "@/components/product/activity-card";
import { CardsIn, StatNumber } from "@/components/product/animate";

export const dynamic = "force-dynamic";

/**
 * Public profile for ANY AniList user — on Oshi or not (open feed, SPEC
 * decision 4). Reacting to a non-member stores the reaction pending; that is
 * the invite hook.
 */
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: raw } = await params;
  const name = decodeURIComponent(raw);
  const viewer = (await sessionUser())!; // layout gates
  const token = viewer.anilistToken() ?? undefined;

  let profile: AniProfile | null = null;
  try {
    profile = await cached(`user:${name.toLowerCase()}`, 600, () =>
      userByName(name, token),
    );
  } catch (e) {
    console.error("[profile]", e);
  }
  if (!profile) notFound();

  const [onOshi, activity] = await Promise.all([
    db()
      .query(`select 1 from users where anilist_id = $1`, [profile.id])
      .then((r) => Boolean(r.rowCount)),
    cached(`uact:${profile.id}:p1`, 180, () =>
      userActivity(profile.id, 1, 15, token),
    ).catch(() => null),
  ]);

  const reactions = activity
    ? await reactionsFor(viewer.id, activity.activities.map((a) => a.id))
    : new Map();

  const isSelf = profile.id === viewer.anilistId;
  const s = profile.statistics;

  return (
    <>
      {/* identity header */}
      <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-white/8 bg-elev/80">
        {profile.bannerImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.bannerImage}
            alt=""
            crossOrigin="anonymous"
            className="absolute inset-0 h-full w-full object-cover opacity-25"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-elev via-elev/70 to-transparent" aria-hidden />
        <div className="relative flex flex-wrap items-center gap-4 p-6 sm:p-8">
          {profile.avatar.large ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar.large}
              alt=""
              width={72}
              height={72}
              crossOrigin="anonymous"
              className="size-[72px] rounded-2xl border border-white/15 object-cover"
            />
          ) : (
            <span className="grid size-[72px] place-items-center rounded-2xl border border-white/15 bg-surface text-2xl font-bold text-muted">
              {profile.name[0]?.toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-tight">
              {profile.name}
              {isSelf && <span className="ml-2 text-sm font-normal text-faint">you</span>}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {onOshi ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/12 px-2.5 py-0.5 text-xs font-medium text-accent-soft">
                  <span className="font-jp" aria-hidden>推</span> on Oshi
                </span>
              ) : (
                <span className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-0.5 text-xs text-muted">
                  not on Oshi yet — reactions reach them when they join
                </span>
              )}
              <a
                href={`https://anilist.co/user/${profile.name}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-faint transition-colors hover:text-paper"
              >
                AniList ↗
              </a>
            </div>
          </div>
          {!isSelf && (
            <span className="ml-auto hidden rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs text-faint sm:inline-block">
              taste match — soon
            </span>
          )}
        </div>
      </div>

      {/* stats strip */}
      <CardsIn className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "anime", value: s.anime.count },
          { label: "episodes", value: s.anime.episodesWatched },
          { label: "manga", value: s.manga.count },
          { label: "chapters", value: s.manga.chaptersRead },
        ].map((stat) => (
          <div
            key={stat.label}
            data-anim
            className="rounded-[var(--radius-card)] border border-white/8 bg-elev/80 px-4 py-3"
          >
            <p className="font-display text-xl font-bold tabular-nums">
              <StatNumber value={stat.value} />
            </p>
            <p className="text-xs text-faint">{stat.label}</p>
          </div>
        ))}
      </CardsIn>

      {/* recent activity */}
      <h2 className="mt-10 font-display text-lg font-semibold">Recent activity</h2>
      {!activity ? (
        <p className="mt-3 text-sm text-muted">
          Could not load their activity right now — try again in a minute.
        </p>
      ) : activity.activities.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Nothing public yet.</p>
      ) : (
        <CardsIn className="mt-4 flex flex-col gap-3">
          {activity.activities.map((a) => (
            <ActivityCard
              key={a.id}
              activity={a}
              reactions={reactions.get(a.id) ?? []}
            />
          ))}
        </CardsIn>
      )}
    </>
  );
}
