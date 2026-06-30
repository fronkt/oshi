export function SyncStrip() {
  return (
    <section className="border-y border-white/8 bg-elev/40">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-5 px-5 py-8 sm:flex-row sm:justify-between sm:px-8">
        <p className="text-sm text-muted">
          Bring your whole history. Sign in once and your list and friends come with you.
        </p>
        <div className="flex items-center gap-7">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://cdn.simpleicons.org/anilist/f4f4f9"
              alt="AniList"
              width={22}
              height={22}
              className="size-5"
            />
            <span className="text-sm font-medium text-paper">AniList</span>
          </div>
          <div className="flex items-center gap-2.5 opacity-55">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://cdn.simpleicons.org/myanimelist/f4f4f9"
              alt="MyAnimeList"
              width={22}
              height={22}
              className="size-5"
            />
            <span className="text-sm font-medium text-paper">MyAnimeList</span>
            <span className="rounded-full border border-white/12 px-2 py-0.5 text-[11px] text-faint">
              soon
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
