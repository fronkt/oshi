import { ArrowDown } from "@phosphor-icons/react/dist/ssr";
import { WaitlistForm } from "./waitlist-form";
import { PhoneMock } from "./phone-mock";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-texture" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bloom-accent" aria-hidden />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-[1200px] flex-col justify-center px-5 pt-28 pb-16 sm:px-8 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
          {/* copy */}
          <div className="max-w-xl">
            <p className="mb-5 text-xs font-medium uppercase tracking-[0.22em] text-accent">
              Early access
            </p>
            <h1 className="font-display text-[2.6rem] font-bold leading-[1.04] tracking-tight sm:text-6xl">
              Anime is better{" "}
              <span className="text-accent">with your people.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              See what your friends are watching, how closely your taste matches,
              and log your next episode in one tap.
            </p>

            <div className="mt-8 max-w-md">
              <WaitlistForm source="hero" />
            </div>

            <a
              href="#how"
              className="group mt-5 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-paper"
            >
              See how it works
              <ArrowDown
                size={15}
                weight="bold"
                className="transition-transform group-hover:translate-y-0.5"
              />
            </a>
          </div>

          {/* live product preview */}
          <div className="lg:pl-6">
            <PhoneMock />
          </div>
        </div>
      </div>
    </section>
  );
}
