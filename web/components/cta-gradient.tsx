"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// shadergradient ships its own bundled three/fiber runtime — load it only when
// the CTA is actually approaching the viewport so the landing bundle stays lean.
const ShaderGradientCanvas = dynamic(
  () => import("shadergradient").then((m) => m.ShaderGradientCanvas),
  { ssr: false },
);
const ShaderGradient = dynamic(
  () => import("shadergradient").then((m) => m.ShaderGradient),
  { ssr: false },
);

/**
 * Full-bleed animated gradient behind the final CTA: deep ink with a slow rose
 * (#ff2e74) current moving through it — dark, viscous, barely moving. Mounts
 * lazily (600px before entering view), and reduced-motion visitors get the
 * static CSS bloom that was here before instead of a WebGL canvas.
 */
export function CtaGradient() {
  const host = useRef<HTMLDivElement>(null);
  const [mount, setMount] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setReduce(true);
      return;
    }
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setMount(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={host} className="absolute inset-0" aria-hidden>
      {mount && !reduce ? (
        <ShaderGradientCanvas
          style={{ position: "absolute", inset: 0 }}
          pixelDensity={1}
          fov={38}
        >
          <ShaderGradient
            type="waterPlane"
            animate="on"
            uTime={0}
            uSpeed={0.13}
            uStrength={1.7}
            uDensity={1.15}
            uFrequency={5.5}
            uAmplitude={0}
            positionX={0}
            positionY={0}
            positionZ={0}
            rotationX={45}
            rotationY={0}
            rotationZ={0}
            color1="#0b0b12"
            color2="#ff2e74"
            color3="#1a0a14"
            reflection={0.12}
            wireframe={false}
            shader="defaults"
            lightType="3d"
            brightness={1.15}
            grain="on"
            cAzimuthAngle={180}
            cPolarAngle={95}
            cDistance={3.2}
            cameraZoom={1}
            envPreset="dawn"
          />
        </ShaderGradientCanvas>
      ) : (
        // static fallback: same mood, zero motion, zero WebGL
        <div className="absolute inset-0 bloom-accent" />
      )}
      {/* legibility scrim over the gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,rgba(11,11,18,0.55)_0%,rgba(11,11,18,0.82)_100%)]" />
    </div>
  );
}
