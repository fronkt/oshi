"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOut } from "@phosphor-icons/react/dist/ssr";

const TABS = [
  { href: "/app", label: "Feed" },
  { href: "/app/library", label: "Library" },
];

/**
 * Product top bar: 推 wordmark home link, Feed/Library tabs, avatar menu
 * (a <details>, so it works before hydration too).
 */
export function ProductNav({
  user,
}: {
  user: { anilistName: string; avatarUrl: string | null };
}) {
  const pathname = usePathname();
  const active =
    pathname === "/app" ? "/app" : pathname.startsWith("/app/library") ? "/app/library" : null;
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4">
      <nav className="mx-auto mt-4 flex h-14 max-w-[860px] items-center justify-between rounded-full border border-white/10 bg-ink/65 pl-5 pr-2.5 backdrop-blur-xl">
        <Link href="/app" className="flex items-center gap-2.5" aria-label="Oshi feed">
          <span className="font-jp text-xl font-bold leading-none text-accent" aria-hidden>
            推
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Oshi</span>
        </Link>

        <div className="flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.04] p-1">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active === t.href ? "page" : undefined}
              className={
                active === t.href
                  ? "rounded-full bg-paper px-4 py-1.5 text-sm font-semibold text-ink"
                  : "rounded-full px-4 py-1.5 text-sm text-muted transition-colors hover:text-paper"
              }
            >
              {t.label}
            </Link>
          ))}
        </div>

        <details className="group relative">
          <summary
            className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1 [&::-webkit-details-marker]:hidden"
            aria-label="Account menu"
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt=""
                width={36}
                height={36}
                crossOrigin="anonymous"
                className="size-9 rounded-full border border-white/15 object-cover"
              />
            ) : (
              <span className="grid size-9 place-items-center rounded-full border border-white/15 bg-surface text-sm font-semibold text-muted">
                {user.anilistName[0]?.toUpperCase()}
              </span>
            )}
          </summary>
          <div className="absolute right-0 top-12 w-52 rounded-2xl border border-white/10 bg-elev/95 p-2 shadow-xl backdrop-blur-xl">
            <p className="truncate px-3 pb-2 pt-1 text-sm text-muted">
              @{user.anilistName}
            </p>
            <Link
              href={`/app/user/${encodeURIComponent(user.anilistName)}`}
              className="block rounded-xl px-3 py-2 text-sm text-paper transition-colors hover:bg-white/5"
            >
              My profile
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-white/5 hover:text-paper"
              >
                <SignOut size={15} weight="bold" /> Log out
              </button>
            </form>
          </div>
        </details>
      </nav>
    </header>
  );
}
