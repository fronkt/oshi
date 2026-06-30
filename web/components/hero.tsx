import { ArrowDown } from "@phosphor-icons/react/dist/ssr";
import { WaitlistForm } from "./waitlist-form";
import { BonsaiSequence } from "./bonsai-sequence";

export function Hero() {
  return (
    <section id="top" className="relative min-h-[100dvh] overflow-hidden">
      {/* scroll-scrubbed Blender bonsai (pre-rendered frames), right-biased on desktop */}
      <div className="absolute inset-0 opacity-60 lg:left-[34%] lg:opacity-100">
        <BonsaiSequence />
      </div>

      {/* legibility scrims */}
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-r from-ink via-ink/85 to-transparent lg:via-ink/35"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-linear-to-t from-ink to-transparent"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-[1200px] flex-col justify-center px-5 pt-28 pb-20 sm:px-8 lg:pt-24">
        <div className="max-w-xl">
          <span className="inline-flex items-center rounded-full border border-white/12 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-paper/80 backdrop-blur-sm">
            Early access
          </span>

          <h1 className="mt-6 font-display text-[2.7rem] font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Anime is better
            <br />
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
