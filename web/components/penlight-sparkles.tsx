"use client";

import { useEffect, useRef } from "react";

/**
 * Sparse rose "penlight" particles drifting upward — the idol-culture wink.
 * Deliberately canvas2D, not another WebGL context: the page already runs the
 * hero scene + CTA gradient, and forty glowing dots don't need a GPU pipeline.
 * Runs only while on screen (IntersectionObserver) and never for reduced-motion.
 */
export function PenlightSparkles({
  count = 40,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  const host = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = host.current;
    if (!canvas) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type P = { x: number; y: number; r: number; v: number; tw: number; hue: string };
    let parts: P[] = [];
    let w = 0,
      h = 0,
      raf = 0,
      visible = false,
      t = 0;
    const dpr = Math.min(devicePixelRatio || 1, 2);

    const seed = () => {
      parts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.7 + Math.random() * 1.6,
        v: 0.06 + Math.random() * 0.22,
        tw: Math.random() * Math.PI * 2,
        hue: Math.random() < 0.75 ? "255, 46, 116" : "255, 211, 226",
      }));
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!parts.length) seed();
    };

    const tick = () => {
      if (!visible) return;
      t += 1;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.v;
        if (p.y < -4) {
          p.y = h + 4;
          p.x = Math.random() * w;
        }
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.03 + p.tw));
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
        g.addColorStop(0, `rgba(${p.hue}, ${a})`);
        g.addColorStop(1, `rgba(${p.hue}, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(tick);
    });
    io.observe(canvas);
    resize();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [count]);

  return (
    <canvas
      ref={host}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden
    />
  );
}
