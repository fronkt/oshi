import { ArrowDown, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { WaitlistForm } from "./waitlist-form";
import { Hero3D } from "./hero-3d";
import { TextReveal } from "./text-reveal";
import { Magnetic } from "./fx";

export function Hero({
  authOn = false,
  loggedIn = false,
}: {
  authOn?: boolean;
  loggedIn?: boolean;
}) {
  return (
    <section id="top" className="relative min-h-[100dvh] overflow-hidden">
      {/* interactive 3D wall of real cover art (CSS wall fallback inside);
          opacity/muting is handled inside so the focus card stays vivid */}
      <div className="absolute inset-0">
        <Hero3D />
      </div>

      {/* legibility scrims */}
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-r from-ink via-ink/90 to-transparent lg:via-ink/55"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-linear-to-t from-ink to-transparent"
        aria-hidden
      />

      {/* pointer-events pass through the content box to the canvas, except on
          the actual interactive column (headline, form, links) */}
      <div className="pointer-events-none relative mx-auto flex min-h-[100dvh] max-w-[1200px] flex-col justify-center px-5 pt-28 pb-20 sm:px-8 lg:pt-24">
        <div className="pointer-events-auto max-w-xl">
          <span className="inline-flex items-center rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-paper/80 backdrop-blur-sm">
            Early access
          </span>

          <TextReveal
            as="h1"
            className="mt-6 font-display text-[2.7rem] font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Anime is better
            <br />
            <span className="text-accent">with your people.</span>
          </TextReveal>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            See what your friends are watching, how closely your taste matches,
            and log your next episode in one tap.
          </p>

          <div className="mt-8 max-w-md">
            {authOn ? (
              <div className="flex flex-wrap items-center gap-4">
                <Magnetic>
                  <a
                    href={loggedIn ? "/app" : "/api/auth/login"}
                    className="group inline-flex items-center gap-2.5 rounded-full bg-accent py-3 pl-6 pr-2.5 text-[15px] font-semibold text-ink transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent-soft active:scale-[0.98]"
                  >
                    {loggedIn ? "Open the app" : "Sign in with AniList"}
                    <span className="grid size-8 place-items-center rounded-full bg-ink/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
                      <ArrowRight size={16} weight="bold" />
                    </span>
                  </a>
                </Magnetic>
                <a
                  href="#waitlist"
                  className="text-sm text-muted transition-colors hover:text-paper"
                >
                  or get the mobile app first
                </a>
              </div>
            ) : (
              <WaitlistForm source="hero" />
            )}
          </div>

          <a
            href="#features"
            className="group mt-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-paper"
          >
            Explore what it does
            <ArrowDown
              size={15}
              weight="bold"
              className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-y-1"
            />
          </a>
        </div>
      </div>
    </section>
  );
}
