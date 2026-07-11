"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  createAnimatable,
  createSpring,
  stagger,
  svg,
  utils,
} from "animejs";
import { prefersReducedMotion } from "./product/animate";

/**
 * anime.js flourish layer for the landing page — additive only. The Motion
 * blur-up Reveals and GSAP scroll choreography stay; these are the details
 * they don't cover: magnetic CTAs, physical bars, a line that draws itself.
 */

const fine = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** Magnetic pull toward the cursor (desktop pointers only), spring-smoothed. */
export function Magnetic({
  children,
  className,
  strength = 0.32,
  radius = 80,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  radius?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !fine()) return;
    const pos = createAnimatable(el, {
      x: 400,
      y: 400,
      ease: "out(3)",
    }) as unknown as { x: (v: number) => void; y: (v: number) => void; revert: () => void };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      const reach = Math.max(r.width, r.height) / 2 + radius;
      if (d < reach) {
        const f = 1 - d / reach;
        pos.x(dx * strength * f);
        pos.y(dy * strength * f);
      } else {
        pos.x(0);
        pos.y(0);
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      pos.revert();
    };
  }, [strength, radius]);

  return (
    <div ref={ref} className={className ?? "inline-block"}>
      {children}
    </div>
  );
}

/** Run once when `el` scrolls into view. */
function onEnter(el: Element, cb: () => void, threshold = 0.5) {
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      cb();
    },
    { threshold },
  );
  io.observe(el);
  return () => io.disconnect();
}

/** The bento recap chart: bars spring up one-by-one when scrolled into view. */
export function RecapBars({ heights }: { heights: number[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const bars = Array.from(root.children) as HTMLElement[];
    utils.set(bars, { scaleY: 0 });
    return onEnter(root, () => {
      animate(bars, {
        scaleY: 1,
        delay: stagger(70),
        ease: createSpring({ stiffness: 180, damping: 16 }),
      });
    });
  }, []);

  return (
    <div ref={ref} className="mt-5 flex h-16 items-end gap-1.5">
      {heights.map((h, i) => (
        <span
          key={i}
          style={{ height: `${h}%`, transformOrigin: "bottom" }}
          className="flex-1 rounded-sm bg-linear-to-t from-accent/30 to-accent"
        />
      ))}
    </div>
  );
}

/** Count-up for the bento taste-match number (SSR shows the final value). */
export function PercentTicker({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    return onEnter(
      el,
      () => {
        const obj = { n: 0 };
        animate(obj, {
          n: value,
          duration: 1100,
          ease: "outExpo",
          modifier: utils.round(0),
          onUpdate: () => {
            el.textContent = String(obj.n);
          },
        });
      },
      0.6,
    );
  }, [value]);

  return <span ref={ref}>{value}</span>;
}

/** How-it-works connector: the line draws itself across when the row enters. */
export function StepConnector() {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    const line = el?.querySelector("line");
    if (!el || !line || prefersReducedMotion()) return;
    const [drawable] = svg.createDrawable(line);
    utils.set(drawable, { draw: "0 0" });
    return onEnter(el, () => {
      animate(drawable, { draw: "0 1", duration: 1300, ease: "inOut(2)" });
    });
  }, []);

  return (
    <svg
      ref={ref}
      className="absolute left-[16%] right-[16%] top-6 hidden h-[2px] w-[68%] md:block"
      viewBox="0 0 100 2"
      preserveAspectRatio="none"
      aria-hidden
    >
      <line
        x1="0"
        y1="1"
        x2="100"
        y2="1"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Penlight-colored particle burst from an element (waitlist success). */
export function burstFrom(el: HTMLElement) {
  if (prefersReducedMotion()) return;
  const colors = ["#ff2e74", "#ff7aa8", "#ffd166", "#a78bfa", "#7ae0c3"];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("span");
    s.style.cssText = `position:absolute;left:20px;top:50%;width:6px;height:6px;margin:-3px;border-radius:9999px;pointer-events:none;background:${colors[i % colors.length]}`;
    s.setAttribute("aria-hidden", "true");
    el.appendChild(s);
    const angle = (i / 14) * Math.PI * 2 + Math.random() * 0.5;
    const dist = 38 + Math.random() * 46;
    animate(s, {
      translateX: Math.cos(angle) * dist,
      translateY: Math.sin(angle) * dist,
      opacity: [1, 0],
      scale: [1, 0.4],
      duration: 700 + Math.random() * 350,
      ease: "outExpo",
      onComplete: () => s.remove(),
    });
  }
}

/** Spring-in used by the waitlist success pill. */
export function springIn(el: HTMLElement) {
  if (prefersReducedMotion()) return;
  animate(el, {
    scale: [0.85, 1],
    opacity: [0, 1],
    ease: createSpring({ stiffness: 260, damping: 15 }),
  });
}
