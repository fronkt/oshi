"use client";

import { useReducedMotion } from "motion/react";
import { ANIME_COVERS } from "@/lib/anime";

// Distribute the covers into columns (round-robin so every column is distinct),
// then duplicate each column so the vertical marquee can loop seamlessly.
const COLS = 4;
const columns = Array.from({ length: COLS }, (_, c) =>
  ANIME_COVERS.filter((_, i) => i % COLS === c),
);
const SPEED = [40, 52, 34, 46]; // seconds per loop, varied for parallax
const DOWN = [false, true, false, true]; // alternate drift direction

/**
 * Semi-opaque hero panel: a wall of real AniList cover art that drifts slowly
 * and fades left→right into the ink so the headline stays legible.
 */
export function AnimeWall() {
  const reduce = useReducedMotion();

  return (
    <div className="wall-mask absolute inset-0 overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex justify-end gap-3 pl-[8%] sm:gap-4">
        {columns.map((col, ci) => {
          const items = [...col, ...col];
          return (
            <div
              key={ci}
              className="flex w-[30vw] max-w-[210px] shrink-0 flex-col"
              style={
                reduce
                  ? undefined
                  : {
                      animation: `wall-${DOWN[ci] ? "down" : "up"} ${SPEED[ci]}s linear infinite`,
                    }
              }
            >
              {items.map((a, i) => (
                <div
                  key={`${a.id}-${i}`}
                  className="relative mb-3 aspect-[2/3] w-full overflow-hidden rounded-xl border border-white/10 bg-surface sm:mb-4"
                  style={{ boxShadow: `0 24px 55px -28px ${a.color}55` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.cover}
                    alt={a.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  {/* keep each poster slightly muted so the panel reads semi-opaque */}
                  <div className="pointer-events-none absolute inset-0 bg-ink/20" aria-hidden />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
