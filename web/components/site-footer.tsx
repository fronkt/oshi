export function SiteFooter() {
  return (
    <footer className="border-t border-white/8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-accent text-ink">
              <span className="font-jp text-[15px] font-bold leading-none">推</span>
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">Oshi</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-faint">
            The social layer for anime. Built for iOS and Android.
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm text-muted sm:items-end">
          <div className="flex gap-6">
            <a href="#features" className="transition-colors hover:text-paper">Features</a>
            <a href="#faq" className="transition-colors hover:text-paper">FAQ</a>
            <a href="mailto:hello@oshi.app" className="transition-colors hover:text-paper">Contact</a>
          </div>
          <p className="text-xs text-faint">
            Not affiliated with AniList or MyAnimeList. &copy; 2026 Oshi.
          </p>
        </div>
      </div>
    </footer>
  );
}
