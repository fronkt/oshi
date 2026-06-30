"use client";

import { useEffect, useRef, useState } from "react";
import { useScroll, useMotionValueEvent, useReducedMotion } from "motion/react";

const FRAMES = 36;
const REDUCED_FRAME = 9; // a nice 3/4 angle for prefers-reduced-motion
const src = (i: number) => `/bonsai/bonsai_${String(i).padStart(3, "0")}.webp`;

/**
 * Apple-style scroll-scrubbed image sequence: pre-rendered Blender Cycles frames
 * of the bonsai, drawn to a canvas at the frame matching hero scroll progress.
 */
export function BonsaiSequence() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const imgs = useRef<HTMLImageElement[]>([]);
  const cur = useRef(0);
  const [loaded, setLoaded] = useState(false);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: wrap,
    offset: ["start start", "end start"],
  });

  function draw(idx: number) {
    const c = canvas.current;
    const im = imgs.current[idx];
    if (!c || !im || !im.complete || !im.naturalWidth) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (!w || !h) return;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
    }
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    const ir = im.naturalWidth / im.naturalHeight;
    const cr = c.width / c.height;
    let dw: number, dh: number;
    if (ir > cr) {
      dw = c.width;
      dh = dw / ir;
    } else {
      dh = c.height;
      dw = dh * ir;
    }
    ctx.drawImage(im, (c.width - dw) / 2, (c.height - dh) / 2, dw, dh);
  }

  // preload frames
  useEffect(() => {
    let done = 0;
    const arr: HTMLImageElement[] = [];
    const onDone = () => {
      if (++done >= FRAMES) {
        setLoaded(true);
        draw(cur.current);
      }
    };
    for (let i = 0; i < FRAMES; i++) {
      const im = new Image();
      im.onload = onDone;
      im.onerror = onDone;
      im.src = src(i);
      arr[i] = im;
    }
    imgs.current = arr;
    cur.current = reduce ? REDUCED_FRAME : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (reduce) return;
    const idx = Math.min(FRAMES - 1, Math.max(0, Math.round(v * (FRAMES - 1))));
    if (idx !== cur.current) {
      cur.current = idx;
      draw(idx);
    }
  });

  useEffect(() => {
    const onResize = () => draw(cur.current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <canvas ref={canvas} className="h-full w-full" />
      {!loaded && (
        <div className="absolute inset-0 bloom-accent opacity-50" aria-hidden />
      )}
    </div>
  );
}
