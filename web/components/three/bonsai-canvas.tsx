"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { useScroll, useMotionValueEvent } from "motion/react";

// WebGL runs client-only; load the scene with no SSR and a soft fallback.
const BonsaiScene = dynamic(
  () => import("./bonsai-scene").then((m) => m.BonsaiScene),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bloom-accent opacity-50" aria-hidden />,
  },
);

export function BonsaiCanvas() {
  const wrap = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const { scrollYProgress } = useScroll({
    target: wrap,
    offset: ["start start", "end start"],
  });
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progress.current = v;
  });

  return (
    <div ref={wrap} className="absolute inset-0">
      <BonsaiScene progress={progress} />
    </div>
  );
}
