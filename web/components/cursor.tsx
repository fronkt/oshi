"use client";

import { useEffect } from "react";
import gsap from "gsap";

/**
 * Site cursor: a rose dot glued to the pointer + cuberto's mouse-follower as
 * the lagging ring. Ring swells over links/buttons, goes grab-scale over the
 * 3D wall, and both yield to the native cursor over form fields (a custom
 * cursor in an email input is how you fail the boring-correctness test).
 * Fine pointers only; touch and reduced-motion never construct any of it.
 */
export function Cursor() {
  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let ring: { destroy(): void } | null = null;
    let dot: HTMLDivElement | null = null;
    let mounted = true;
    let moveX: ((v: number) => void) | null = null;
    let moveY: ((v: number) => void) | null = null;

    const onMove = (e: MouseEvent) => {
      moveX?.(e.clientX);
      moveY?.(e.clientY);
    };
    // native cursor (and no custom chrome) over anything typeable
    const onOver = (e: MouseEvent) => {
      const typing = !!(e.target as HTMLElement).closest?.("input, textarea, select");
      document.documentElement.classList.toggle("cursor-native", typing);
    };

    import("mouse-follower").then(({ default: MouseFollower }) => {
      if (!mounted) return;
      MouseFollower.registerGSAP(gsap);
      ring = new MouseFollower({
        speed: 0.5,
        skewing: 1.2,
        stateDetection: {
          "-pointer": "a, button, [role=button], label[for]",
          "-grab": "#top canvas",
        },
      });

      dot = document.createElement("div");
      dot.id = "cursor-dot";
      dot.setAttribute("aria-hidden", "true");
      document.body.appendChild(dot);
      moveX = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2.out" });
      moveY = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2.out" });
      document.documentElement.classList.add("has-cursor");
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("mouseover", onOver, { passive: true });
    });

    return () => {
      mounted = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      ring?.destroy();
      dot?.remove();
      document.documentElement.classList.remove("has-cursor", "cursor-native");
    };
  }, []);

  return null;
}
