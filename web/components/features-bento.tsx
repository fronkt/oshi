import {
  UsersThree,
  Sparkle,
  Play,
  Smiley,
  CalendarBlank,
} from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "./reveal";

export function FeaturesBento() {
  return (
    <section id="features" className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 sm:py-32">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Built for the way you actually watch.
        </h2>
        <p className="mt-4 max-w-lg text-lg text-muted">
          Five pieces that turn a solo tracker into a place you and your friends
          keep coming back to.
        </p>
      </div>

      <div className="mt-12 grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 md:grid-cols-6">
        {/* Feed — large, with visual */}
        <Reveal className="md:col-span-4 md:row-span-2">
          <article className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-white/8 bg-surface p-7">
            <div className="pointer-events-none absolute -right-10 -top-10 size-60 bloom-accent opacity-80" />
            <Icon>
              <UsersThree size={20} weight="bold" />
            </Icon>
            <h3 className="mt-5 font-display text-2xl font-semibold tracking-tight">
              The open feed
            </h3>
            <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
              Your AniList friends&apos; activity, live from minute one. No empty
              app, no waiting for everyone to join first.
            </p>

            {/* mini visual: stacked activity */}
            <div className="mt-7 space-y-2.5">
              {[
                { who: "Rin", what: "rated Mushishi a 9" },
                { who: "Kenji", what: "started Vinland Saga" },
              ].map((r) => (
                <div
                  key={r.who}
                  className="flex items-center gap-3 rounded-xl border border-white/8 bg-ink/60 px-3.5 py-2.5"
                >
                  <span className="size-7 rounded-full bg-linear-to-br from-accent to-accent-soft" />
                  <p className="text-[13px] text-paper">
                    <span className="font-semibold">{r.who}</span>{" "}
                    <span className="text-muted">{r.what}</span>
                  </p>
                </div>
              ))}
            </div>
          </article>
        </Reveal>

        {/* Score — visual number */}
        <Reveal delay={0.06} className="md:col-span-2">
          <article className="relative flex h-full flex-col justify-between overflow-hidden rounded-[var(--radius-card)] border border-accent/20 bg-linear-to-br from-accent/12 to-transparent p-7">
            <Icon>
              <Sparkle size={20} weight="fill" />
            </Icon>
            <div className="mt-6">
              <p className="font-display text-5xl font-bold tracking-tight text-paper">
                92<span className="text-accent">%</span>
              </p>
              <h3 className="mt-3 font-display text-lg font-semibold">
                Taste-match score
              </h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
                Niche-weighted to reward the deep cuts you share, not the shows
                everyone watched.
              </p>
            </div>
          </article>
        </Reveal>

        {/* Logger */}
        <Reveal delay={0.12} className="md:col-span-2">
          <FeatureCard
            icon={<Play size={20} weight="fill" />}
            title="One-tap logging"
            body="A home-screen widget with play, skip, and done. Update progress without opening the app."
          />
        </Reveal>

        {/* Stickers */}
        <Reveal delay={0.06} className="md:col-span-3">
          <FeatureCard
            icon={<Smiley size={20} weight="bold" />}
            title="React with stickers"
            body="Drop a sticker on a friend's finale. Import your own, and unlock custom packs by inviting a friend."
          />
        </Reveal>

        {/* Recap — gradient visual */}
        <Reveal delay={0.12} className="md:col-span-3">
          <article className="relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-white/8 bg-surface p-7">
            <Icon>
              <CalendarBlank size={20} weight="bold" />
            </Icon>
            <h3 className="mt-5 font-display text-lg font-semibold">Your anime week</h3>
            <p className="mt-1.5 max-w-xs text-[14px] leading-relaxed text-muted">
              A shareable recap of what you watched and who you watched alongside,
              every Sunday.
            </p>
            <div className="mt-5 flex h-16 items-end gap-1.5">
              {[40, 64, 28, 80, 52, 70, 36].map((h, i) => (
                <span
                  key={i}
                  style={{ height: `${h}%` }}
                  className="flex-1 rounded-sm bg-linear-to-t from-accent/30 to-accent"
                />
              ))}
            </div>
          </article>
        </Reveal>
      </div>
    </section>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid size-10 place-items-center rounded-xl border border-white/10 bg-ink text-accent">
      {children}
    </span>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="flex h-full flex-col rounded-[var(--radius-card)] border border-white/8 bg-surface p-7">
      <Icon>{icon}</Icon>
      <h3 className="mt-5 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{body}</p>
    </article>
  );
}
