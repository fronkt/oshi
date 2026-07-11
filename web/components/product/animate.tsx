"use client";

import { useEffect, useRef } from "react";
import { animate, createSpring, stagger, utils } from "animejs";

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Springy scale pop for tap feedback (reaction chips, quick-log). */
export function springPop(el: Element | null, peak = 1.22) {
  if (!el || prefersReducedMotion()) return;
  animate(el, {
    scale: [
      { to: peak, duration: 90, ease: "out(2)" },
      { to: 1, ease: createSpring({ stiffness: 320, damping: 11 }) },
    ],
  });
}

/**
 * Staggered entrance for server-rendered lists. Children opt in with
 * `data-anim`; globals.css holds them invisible until mount, then they
 * cascade in — top-down, or rippling out from the top-right corner (where
 * the library's tab switch lives) with `origin="top-right"`. Only elements
 * near the initial viewport animate; deep sections appear instantly.
 */
export function CardsIn({
  children,
  className,
  origin = "top",
}: {
  children: React.ReactNode;
  className?: string;
  origin?: "top" | "top-right";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const release = () => {
      root.dataset.cards = "done";
    };
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-anim]"));
    if (!items.length || prefersReducedMotion()) return release();

    const fold = window.innerHeight * 1.3;
    const near = items.filter((el) => el.getBoundingClientRect().top < fold);
    const far = items.filter((el) => !near.includes(el));
    if (far.length) utils.set(far, { opacity: 1 });
    if (!near.length) return release();
    utils.set(near, { opacity: 0, translateY: 14 });
    release(); // same tick as the sets above — no flash

    let delay: unknown = stagger(45, { start: 40 });
    if (origin === "top-right") {
      const r = root.getBoundingClientRect();
      const byDistance = new Map(
        near.map((el) => {
          const b = el.getBoundingClientRect();
          const dx = r.right - (b.left + b.width / 2);
          const dy = b.top + b.height / 2 - r.top;
          return [el, Math.min(650, Math.hypot(dx, dy) * 0.45)];
        }),
      );
      delay = (el: unknown) => byDistance.get(el as HTMLElement) ?? 0;
    }

    const anim = animate(near, {
      opacity: 1,
      translateY: 0,
      duration: 520,
      ease: "outExpo",
      delay: delay as number,
    });
    return () => {
      anim.cancel();
    };
  }, [origin]);

  return (
    <div ref={ref} data-cards="pending" className={className}>
      {children}
    </div>
  );
}

/** Count-up number (profile stats). SSR renders the final value for no-JS. */
export function StatNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  // fixed locale: server and client must format identically (hydration)
  const fmt = (n: number) => n.toLocaleString("en-US");

  useEffect(() => {
    const el = ref.current;
    if (!el || value === 0 || prefersReducedMotion()) return;
    const obj = { n: 0 };
    const anim = animate(obj, {
      n: value,
      duration: 900,
      ease: "outExpo",
      modifier: utils.round(0),
      onUpdate: () => {
        el.textContent = fmt(obj.n);
      },
    });
    return () => {
      anim.cancel();
    };
  }, [value]);

  return <span ref={ref}>{fmt(value)}</span>;
}
