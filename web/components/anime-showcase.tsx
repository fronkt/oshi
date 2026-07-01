"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";
import { ANIME_COVERS } from "@/lib/anime";

// the showcase scrolls through the full cover set (same list the hero wall uses)
const FEATURED = ANIME_COVERS;

// light social context sprinkled across the scroll (plain captions, never overlaid on art)
const ACTIVITY: (string | null)[] = [
  "Mei finished this",
  "3 friends watching",
  null,
  "Kenji rated it 9",
  "Rin added it",
  null,
  "2 friends loved it",
  null,
  "Aki is watching",
  null,
  "Mei rated it 10",
  null,
  "Yuki finished this",
  null,
  "4 friends watching",
  null,
  "Sora rated it 8",
  null,
  "Rin loved it",
  null,
  "Kenji added it",
  null,
  "Nao is watching",
  null,
  "3 friends rated it",
  null,
  "Haru finished this",
  null,
  "Aki rated it 9",
  null,
  "Mei added it",
];

export function AnimeShowcase() {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !wrap.current || !track.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      const el = track.current!;
      const distance = () => el.scrollWidth - window.innerWidth + 96;
      const tween = gsap.to(el, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: wrap.current!,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });
    return () => mm.revert();
  }, [reduce]);

  return (
    <section id="showcase" className="relative border-y border-white/8 bg-[#070709]">
      <div
        ref={wrap}
        className="flex flex-col justify-center gap-9 py-20 md:h-[100dvh] md:py-0"
      >
        <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
          <h2 className="max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Real titles. Real ratings. The friends watching alongside you.
          </h2>
          <p className="mt-4 max-w-md text-lg text-muted">
            Your feed is built from live AniList activity, not a generic timeline.
          </p>
        </div>

        <div
          ref={track}
          className="flex gap-5 overflow-x-auto px-5 pb-4 will-change-transform sm:px-8 md:overflow-visible md:pb-0 md:pl-[max(2rem,calc((100vw-1200px)/2))]"
        >
          {FEATURED.map((a, i) => (
            <article key={a.id} className="group w-[200px] shrink-0">
              <div
                className="overflow-hidden rounded-2xl border border-white/10 bg-surface"
                style={{ boxShadow: `0 30px 60px -30px ${a.color}55` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.cover}
                  alt={a.title}
                  width={200}
                  height={285}
                  loading="lazy"
                  className="h-[285px] w-[200px] object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
                />
              </div>
              <div className="mt-3.5 px-0.5">
                <h3 className="line-clamp-1 text-[15px] font-semibold text-paper">
                  {a.title}
                </h3>
                <p className="mt-0.5 text-xs text-faint">
                  {a.year}
                  {a.score ? ` · ${a.score}%` : ""}
                </p>
                {ACTIVITY[i] && (
                  <p className="mt-2 text-xs font-medium text-accent-soft">
                    {ACTIVITY[i]}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
