"use client";

import { useEffect, useState } from "react";
import { LiquidMetal } from "@paper-design/shaders-react";

/**
 * The 推 logomark rendered through paper.design's liquid-metal shader: chrome
 * with a slow rose-tinted specular sweep. The glyph is rasterized at runtime
 * (offscreen canvas, after fonts load) because the shader wants an image mask.
 * Until the raster is ready — and for any failure — it renders the original
 * flat accent mark, so the nav never flashes empty.
 */
export function LiquidMark() {
  const [glyph, setGlyph] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    document.fonts.ready.then(() => {
      if (!alive) return;
      try {
        // resolve the real (next/font-mangled) family name from the DOM
        const probe = document.createElement("span");
        probe.className = "font-jp";
        probe.style.position = "absolute";
        probe.style.visibility = "hidden";
        document.body.appendChild(probe);
        const family = getComputedStyle(probe).fontFamily;
        probe.remove();

        const c = document.createElement("canvas");
        c.width = c.height = 256;
        const ctx = c.getContext("2d");
        if (!ctx) return;
        // dark glyph on transparent: the shader's preprocessor keys the metal
        // off dark/opaque pixels (same as paper's liquid-logo uploads)
        ctx.fillStyle = "#0b0b12";
        ctx.font = `700 208px ${family}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("推", 128, 136);
        setGlyph(c.toDataURL("image/png"));
      } catch {
        /* keep flat-mark fallback */
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!glyph) {
    return (
      <span className="grid size-7 place-items-center rounded-lg bg-accent text-ink">
        <span className="font-jp text-[15px] font-bold leading-none">推</span>
      </span>
    );
  }

  return (
    <span className="block size-7 overflow-hidden rounded-lg bg-ink ring-1 ring-white/10">
      <LiquidMetal
        style={{ width: "100%", height: "100%" }}
        image={glyph}
        colorBack="#0b0b1200"
        colorTint="#ffd3e2"
        softness={0.35}
        repetition={2}
        shiftRed={0.3}
        shiftBlue={0.3}
        distortion={0.12}
        contour={0.6}
        speed={0.55}
        scale={0.94}
      />
    </span>
  );
}
