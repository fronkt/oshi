import Link from "next/link";
import type { ListActivity } from "@/lib/server/anilist";
import { displayTitle } from "@/lib/server/anilist";
import { actionPhrase, timeAgo } from "@/lib/activity";
import { ReactionBar, type ReactionCount } from "./reaction-bar";

/**
 * One feed item: avatar · "name watched episode 5 of Title" · cover · reactions.
 * Rendered from the short-TTL cache of AniList's public activity (pointer ids,
 * never stored content).
 */
export function ActivityCard({
  activity,
  reactions,
}: {
  activity: ListActivity;
  reactions: ReactionCount[];
}) {
  const a = activity;
  const title = displayTitle(a.media);

  return (
    <article className="flex gap-4 rounded-[var(--radius-card)] border border-white/8 bg-elev/80 p-4 transition-colors duration-300 hover:border-white/15">
      <Link
        href={`/app/user/${encodeURIComponent(a.user.name)}`}
        className="shrink-0"
        aria-label={`${a.user.name}'s profile`}
      >
        {a.user.avatar.large ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.user.avatar.large}
            alt=""
            width={40}
            height={40}
            loading="lazy"
            crossOrigin="anonymous"
            className="size-10 rounded-full border border-white/10 object-cover"
          />
        ) : (
          <span className="grid size-10 place-items-center rounded-full border border-white/10 bg-surface text-sm font-semibold text-muted">
            {a.user.name[0]?.toUpperCase()}
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-snug text-muted">
          <Link
            href={`/app/user/${encodeURIComponent(a.user.name)}`}
            className="font-semibold text-paper transition-colors hover:text-accent-soft"
          >
            {a.user.name}
          </Link>{" "}
          {actionPhrase(a.status, a.progress)}{" "}
          <a
            href={a.media.siteUrl}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-paper transition-colors hover:text-accent-soft"
          >
            {title}
          </a>
        </p>
        <p className="mt-1 text-xs text-faint">{timeAgo(a.createdAt)}</p>
        <ReactionBar
          activityId={a.id}
          targetAnilistId={a.user.id}
          initial={reactions}
        />
      </div>

      {a.media.coverImage.large && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={a.media.coverImage.large}
          alt={title}
          width={56}
          height={80}
          loading="lazy"
          crossOrigin="anonymous"
          className="h-20 w-14 shrink-0 rounded-lg border border-white/10 object-cover"
          style={
            a.media.coverImage.color
              ? { boxShadow: `0 10px 24px -12px ${a.media.coverImage.color}66` }
              : undefined
          }
        />
      )}
    </article>
  );
}
