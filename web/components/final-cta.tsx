import { WaitlistForm } from "./waitlist-form";
import { CtaGradient } from "./cta-gradient";
import { TextReveal } from "./text-reveal";
import { PenlightSparkles } from "./penlight-sparkles";
import { Magnetic } from "./fx";

export function FinalCta({ appLive = false }: { appLive?: boolean }) {
  return (
    <section id="waitlist" className="px-5 py-24 sm:px-8 sm:py-32">
      <div className="relative mx-auto max-w-[1000px] overflow-hidden rounded-[var(--radius-xl)] border border-accent/20 bg-elev px-6 py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <CtaGradient />
          <PenlightSparkles count={44} />
        </div>
        <div className="relative mx-auto max-w-xl">
          <TextReveal className="font-display text-4xl font-bold tracking-tight sm:text-6xl">
            Find your people.
          </TextReveal>
          <p className="mt-4 text-lg text-muted">
            {appLive
              ? "The web app is live — sign in with AniList and your feed is full from minute one. Want the mobile app and home-screen widget first? Leave your email."
              : "Oshi is rolling out now. Add your email and we will send your invite when a spot opens."}
          </p>
          {appLive && (
            <Magnetic className="mt-7 inline-block">
              <a
                href="/api/auth/login"
                className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-[15px] font-semibold text-ink transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent-soft active:scale-[0.98]"
              >
                Sign in with AniList
              </a>
            </Magnetic>
          )}
          <div className="mx-auto mt-8 max-w-md">
            <WaitlistForm source={appLive ? "mobile-waitlist" : "cta"} />
          </div>
        </div>
      </div>
    </section>
  );
}
