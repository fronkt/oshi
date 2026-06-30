import { Plugs, DeviceMobileCamera, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { Reveal } from "./reveal";

const STEPS = [
  {
    icon: <Plugs size={22} weight="bold" />,
    title: "Connect your list",
    body: "Sign in with AniList. Your history, ratings, and the people you follow come with you.",
  },
  {
    icon: <DeviceMobileCamera size={22} weight="bold" />,
    title: "Add the widget",
    body: "Put Oshi on your home screen. Log progress and glance at your feed without opening the app.",
  },
  {
    icon: <UsersThree size={22} weight="bold" />,
    title: "Watch together, apart",
    body: "React to finales, compare taste, and get a weekly recap of who you watched alongside.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8 sm:py-32">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Set up in under a minute.
        </h2>
        <p className="mt-4 max-w-md text-lg text-muted">
          No new social graph to build. Oshi plugs into the account you already use.
        </p>
      </div>

      <div className="relative mt-14 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
        {/* connector line behind the icon row (desktop) */}
        <div
          className="absolute left-[16%] right-[16%] top-6 hidden h-px bg-white/10 md:block"
          aria-hidden
        />
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.08} className="relative">
            <span className="grid size-12 place-items-center rounded-full border border-white/12 bg-ink text-accent">
              {s.icon}
            </span>
            <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">
              {s.title}
            </h3>
            <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-muted">
              {s.body}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
