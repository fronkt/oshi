import { WaitlistForm } from "./waitlist-form";

export function FinalCta() {
  return (
    <section id="waitlist" className="px-5 py-24 sm:px-8 sm:py-32">
      <div className="relative mx-auto max-w-[1000px] overflow-hidden rounded-[var(--radius-xl)] border border-accent/20 bg-elev px-6 py-16 text-center sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bloom-accent" aria-hidden />
        <div className="relative mx-auto max-w-xl">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
            Find your people.
          </h2>
          <p className="mt-4 text-lg text-muted">
            Oshi is rolling out now. Add your email and we will send your invite
            when a spot opens.
          </p>
          <div className="mx-auto mt-8 max-w-md">
            <WaitlistForm source="cta" />
          </div>
        </div>
      </div>
    </section>
  );
}
