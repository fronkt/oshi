"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { X } from "@phosphor-icons/react/dist/ssr";
import { AnimeWall } from "./anime-wall";
import type { AnimeCover } from "@/lib/anime";

const Scene = dynamic(() => import("./hero-3d-scene"), { ssr: false });

/**
 * Tier gate + DOM chrome for the 3D hero wall.
 * - reduced-motion or no WebGL → the original CSS wall (also our revert path)
 * - otherwise the CSS wall paints instantly and cross-fades into the 3D scene
 *   once enough textures have arrived (no blank hero, no double wall)
 * - renders the focus caption card and owns Esc-to-dismiss
 */
export function Hero3D() {
  const [tier, setTier] = useState<"pending" | "css" | "3d">("pending");
  const [coarse, setCoarse] = useState(false);
  const [ready, setReady] = useState(false);
  const [focused, setFocused] = useState<AnimeCover | null>(null);
  const dismissRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let webgl = false;
    try {
      const c = document.createElement("canvas");
      webgl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      webgl = false;
    }
    setCoarse(matchMedia("(pointer: coarse)").matches);
    setTier(reduce || !webgl ? "css" : "3d");
  }, []);

  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissRef.current?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused]);

  const onFocus = useCallback((a: AnimeCover | null) => setFocused(a), []);
  const onReady = useCallback(() => setReady(true), []);

  if (tier === "css" || tier === "pending") {
    return (
      <div className="absolute inset-0 opacity-45 lg:opacity-70">
        <AnimeWall />
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      {/* CSS wall underlay until the textures arrive (matches the old look) */}
      <div
        className={`absolute inset-0 opacity-45 transition-opacity duration-1000 lg:opacity-70 ${ready ? "!opacity-0" : ""}`}
        aria-hidden
      >
        <AnimeWall />
      </div>

      <div
        className={`absolute inset-0 opacity-60 transition-opacity duration-1000 lg:opacity-100 ${ready ? "" : "!opacity-0"}`}
      >
        <Scene
          coarse={coarse}
          onFocus={onFocus}
          onReady={onReady}
          dismissRef={dismissRef}
        />
      </div>

      {/* focus caption card */}
      <div
        className={`absolute bottom-16 right-5 z-10 w-[19rem] max-w-[calc(100vw-2.5rem)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] sm:right-10 sm:bottom-20 ${
          focused
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        {focused && (
          <div className="rounded-2xl border border-white/12 bg-ink/75 p-4 shadow-[0_24px_70px_-20px_rgba(255,46,116,0.35)] backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <p className="font-display text-base font-semibold leading-snug">
                {focused.title}
              </p>
              <button
                type="button"
                aria-label="Close"
                onClick={() => dismissRef.current?.()}
                className="grid size-7 shrink-0 place-items-center rounded-full border border-white/10 text-muted transition-colors hover:text-paper"
              >
                <X size={13} weight="bold" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted">
              {[
                focused.year,
                focused.genres.slice(0, 2).join(" · "),
                focused.score ? `${focused.score}% on AniList` : null,
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-paper/85">
              See which friends match your taste on this one — that&apos;s what
              Oshi is for.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
