import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { sessionUser } from "@/lib/server/session";
import { followingActivity } from "@/lib/server/anilist";
import { cached } from "@/lib/server/cached";
import { reactionsFor } from "@/lib/server/reactions";
import { ActivityCard } from "@/components/product/activity-card";

export const dynamic = "force-dynamic";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const user = (await sessionUser())!; // layout gates
  const token = user.anilistToken();

  if (!token) {
    return (
      <ErrorCard
        title="Reconnect AniList"
        body="Your AniList connection is missing. Sign in again to rebuild it."
      />
    );
  }

  let feed: Awaited<ReturnType<typeof followingActivity>>;
  try {
    // 90s TTL: fresh enough to feel live, cheap against the 30 req/min cap
    feed = await cached(`feed:${user.id}:p${page}`, 90, () =>
      followingActivity(token, page, 25),
    );
  } catch (e) {
    console.error("[feed]", e);
    return (
      <ErrorCard
        title="AniList is not answering"
        body="Could not load your feed right now — AniList may be rate-limiting or your session expired. Try again in a minute, or sign in again."
      />
    );
  }

  const reactions = await reactionsFor(
    user.id,
    feed.activities.map((a) => a.id),
  );

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Feed</h1>
          <p className="mt-1 text-sm text-muted">
            Everyone you follow on AniList — live, whether they are on Oshi or not.
          </p>
        </div>
        {page > 1 && (
          <p className="text-xs text-faint">page {page}</p>
        )}
      </div>

      {feed.activities.length === 0 ? (
        <div className="mt-10 rounded-[var(--radius-card)] border border-white/8 bg-elev/80 p-8 text-center">
          <p className="font-display text-lg font-semibold">Your feed is warming up</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Follow a few people on AniList and their watching activity shows up
            here instantly — they do not need Oshi for you to see them.
          </p>
          <a
            href="https://anilist.co/search/users"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-accent-soft"
          >
            Find people on AniList <ArrowRight size={15} weight="bold" />
          </a>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {feed.activities.map((a) => (
            <ActivityCard
              key={a.id}
              activity={a}
              reactions={reactions.get(a.id) ?? []}
            />
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        {page > 1 ? (
          <Link
            href={page === 2 ? "/app" : `/app?page=${page - 1}`}
            className="text-sm text-muted transition-colors hover:text-paper"
          >
            ← Newer
          </Link>
        ) : (
          <span />
        )}
        {feed.pageInfo.hasNextPage && (
          <Link
            href={`/app?page=${page + 1}`}
            className="text-sm text-muted transition-colors hover:text-paper"
          >
            Older →
          </Link>
        )}
      </div>
    </>
  );
}

function ErrorCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-10 rounded-[var(--radius-card)] border border-accent/25 bg-elev/80 p-8 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{body}</p>
      <a
        href="/api/auth/login"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-accent-soft"
      >
        Sign in with AniList
      </a>
    </div>
  );
}
