"use client";

import { useRef } from "react";

/**
 * Bento card with a cursor-tracked rose spotlight (the Aceternity pattern,
 * vendored: one radial-gradient driven by two CSS vars, no dependency).
 * Renders as <article>; the glow lives on a ::before via .spotlight-card.
 */
export function SpotlightCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  return (
    <article
      ref={ref}
      className={`spotlight-card ${className}`}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--sx", `${e.clientX - r.left}px`);
        el.style.setProperty("--sy", `${e.clientY - r.top}px`);
      }}
    >
      {children}
    </article>
  );
}
