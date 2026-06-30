"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

const SCORE = 92;
const R = 80;
const CIRC = 2 * Math.PI * R;
const SHARED = ["Mushishi", "Frieren", "Vinland Saga"];

export function Compatibility() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setVal(SCORE);
      return;
    }
    const controls = animate(0, SCORE, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce]);

  return (
    <section id="compat" className="relative overflow-hidden border-y border-white/8 bg-elev/40">
      <div className="pointer-events-none absolute inset-0 bloom-accent opacity-60" aria-hidden />
      <div
        ref={ref}
        className="relative mx-auto flex max-w-2xl flex-col items-center px-5 py-24 text-center sm:py-32"
      >
        {/* avatars */}
        <div className="mb-8 flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://i.pravatar.cc/96?img=5"
            alt="Your avatar"
            width={52}
            height={52}
            className="size-13 rounded-full border-2 border-ink object-cover"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://i.pravatar.cc/96?img=47"
            alt="Mei's avatar"
            width={52}
            height={52}
            className="-ml-4 size-13 rounded-full border-2 border-ink object-cover"
          />
        </div>

        {/* ring */}
        <div className="relative grid place-items-center">
          <svg width="200" height="200" viewBox="0 0 200 200" className="-rotate-90">
            <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
            <circle
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - val / 100)}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="font-display text-5xl font-bold tracking-tight">{val}%</span>
            <span className="text-sm text-muted">taste match</span>
          </div>
        </div>

        <h2 className="mt-10 font-display text-3xl font-bold tracking-tight sm:text-5xl">
          How well does your taste actually match?
        </h2>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
          Oshi compares your lists the way a friend would. Shared megahits count for
          little. The obscure shows you both love count for a lot. That is your score,
          with the reason spelled out.
        </p>

        <div className="mt-8 rounded-[var(--radius-card)] border border-white/8 bg-surface px-6 py-5">
          <p className="text-[15px] text-paper">
            You both go deep on slice-of-life and slow-burn fantasy.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {SHARED.map((t) => (
              <span
                key={t}
                className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[13px] text-accent-soft"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
