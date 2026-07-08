import Link from "next/link";
import { sessionUser } from "@/lib/server/session";
import {
  mediaListCollection,
  displayTitle,
  type ListEntry,
  type MediaListStatus,
  type MediaType,
} from "@/lib/server/anilist";
import { cached } from "@/lib/server/cached";
import { QuickLog } from "@/components/product/quick-log";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const SECTION_ORDER: { status: MediaListStatus; anime: string; manga: string }[] = [
  { status: "CURRENT", anime: "Watching", manga: "Reading" },
  { status: "REPEATING", anime: "Rewatching", manga: "Rereading" },
  { status: "PAUSED", anime: "Paused", manga: "Paused" },
  { status: "PLANNING", anime: "Planning", manga: "Planning" },
  { status: "COMPLETED", anime: "Completed", manga: "Completed" },
  { status: "DROPPED", anime: "Dropped", manga: "Dropped" },
];

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const type: MediaType = params.type?.toLowerCase() === "manga" ? "MANGA" : "ANIME";
  const user = (await sessionUser())!; // layout gates
  const token = user.anilistToken() ?? undefined;

  let lists: Awaited<ReturnType<typeof mediaListCollection>>["lists"] = [];
  let failed = false;
  try {
    // 5 min TTL; busted immediately by /api/log writes
    const col = await cached(`list:${user.anilistId}:${type}`, 300, () =>
      mediaListCollection(user.anilistId, type, token),
    );
    lists = col.lists;
  } catch (e) {
    console.error("[library]", e);
    failed = true;
  }

  const byStatus = new Map<MediaListStatus, ListEntry[]>();
  for (const l of lists) {
    if (!l.status) continue; // skip custom lists (entries also live in a status list)
    const entries = [...l.entries].sort((a, b) => b.updatedAt - a.updatedAt);
    byStatus.set(l.status, [...(byStatus.get(l.status) ?? []), ...entries]);
  }
  const total = [...byStatus.values()].reduce((n, l) => n + l.length, 0);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Library</h1>
          <p className="mt-1 text-sm text-muted">
            Your AniList, live — log from here and it syncs back instantly.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.04] p-1">
          {(["ANIME", "MANGA"] as const).map((t) => (
            <Link
              key={t}
              href={t === "ANIME" ? "/app/library" : "/app/library?type=manga"}
              aria-current={type === t ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm capitalize",
                type === t
                  ? "bg-paper font-semibold text-ink"
                  : "text-muted transition-colors hover:text-paper",
              )}
            >
              {t.toLowerCase()}
            </Link>
          ))}
        </div>
      </div>

      {failed ? (
        <div className="mt-10 rounded-[var(--radius-card)] border border-accent/25 bg-elev/80 p-8 text-center">
          <p className="font-display text-lg font-semibold">Could not load your list</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            AniList did not answer. Try again in a minute, or sign in again if it
            keeps happening.
          </p>
        </div>
      ) : total === 0 ? (
        <div className="mt-10 rounded-[var(--radius-card)] border border-white/8 bg-elev/80 p-8 text-center">
          <p className="font-display text-lg font-semibold">
            Nothing in your {type.toLowerCase()} list yet
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Add titles on AniList and they appear here — one-tap logging included.
          </p>
        </div>
      ) : (
        SECTION_ORDER.map(({ status, anime, manga }) => {
          const entries = byStatus.get(status);
          if (!entries?.length) return null;
          const label = type === "ANIME" ? anime : manga;
          const loggable = status === "CURRENT" || status === "REPEATING";
          return (
            <section key={status} className="mt-10">
              <h2 className="flex items-baseline gap-2 font-display text-lg font-semibold">
                {label}
                <span className="text-sm font-normal text-faint">{entries.length}</span>
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {entries.map((e) => (
                  <article
                    key={e.id}
                    className="flex gap-3.5 rounded-[var(--radius-card)] border border-white/8 bg-elev/80 p-3 transition-colors duration-300 hover:border-white/15"
                  >
                    {e.media.coverImage.large && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={e.media.coverImage.large}
                        alt={displayTitle(e.media)}
                        width={56}
                        height={80}
                        loading="lazy"
                        crossOrigin="anonymous"
                        className="h-20 w-14 shrink-0 rounded-lg border border-white/10 object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1 py-0.5">
                      <a
                        href={e.media.siteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="line-clamp-1 text-[15px] font-semibold text-paper transition-colors hover:text-accent-soft"
                      >
                        {displayTitle(e.media)}
                      </a>
                      <p className="mt-0.5 text-xs text-faint">
                        {e.media.format ?? ""}
                        {e.score ? ` · your score ${e.score}` : ""}
                      </p>
                      <div className="mt-2">
                        {loggable ? (
                          <QuickLog
                            mediaId={e.media.id}
                            progress={e.progress}
                            total={type === "ANIME" ? e.media.episodes : e.media.chapters}
                            unit={type === "ANIME" ? "ep" : "ch"}
                          />
                        ) : (
                          <span className="text-xs tabular-nums text-faint">
                            {e.progress > 0 &&
                              `${e.progress}${
                                type === "ANIME"
                                  ? e.media.episodes
                                    ? ` / ${e.media.episodes}`
                                    : ""
                                  : e.media.chapters
                                    ? ` / ${e.media.chapters}`
                                    : ""
                              } ${type === "ANIME" ? "ep" : "ch"}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })
      )}
    </>
  );
}
