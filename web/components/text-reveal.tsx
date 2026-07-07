"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

/**
 * Masked line-by-line reveal for headings (GSAP SplitText — free since 3.13).
 * Splits after fonts settle so line breaks are final, animates once on scroll
 * into view, and never runs for reduced-motion (text just renders).
 */
export function TextReveal({
  as: Tag = "h2",
  className,
  children,
  delay = 0,
}: {
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);

    let split: SplitText | undefined;
    let tween: gsap.core.Tween | undefined;
    let cancelled = false;

    document.fonts.ready.then(() => {
      if (cancelled || !ref.current) return;
      split = SplitText.create(el, { type: "lines", mask: "lines" });
      tween = gsap.from(split.lines, {
        yPercent: 115,
        duration: 1.05,
        stagger: 0.09,
        ease: "power4.out",
        delay,
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    });

    return () => {
      cancelled = true;
      tween?.scrollTrigger?.kill();
      tween?.kill();
      split?.revert();
    };
  }, [delay]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
