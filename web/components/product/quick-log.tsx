"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { animate, createSpring } from "animejs";
import { Check, Plus } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import { prefersReducedMotion, springPop } from "./animate";

/**
 * One-tap logging on a library entry (the signal wedge, web edition):
 * +1 episode/chapter and mark-complete, with a short undo window after +1.
 * Writes go device -> Oshi API -> AniList; the token never leaves the server.
 */
export function QuickLog({
  mediaId,
  progress,
  total,
  unit,
}: {
  mediaId: number;
  progress: number;
  total: number | null;
  unit: "ep" | "ch";
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(progress);
  const [busy, setBusy] = useState(false);
  const [undoable, setUndoable] = useState(false);
  const [done, setDone] = useState(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (done && doneRef.current && !prefersReducedMotion()) {
      animate(doneRef.current, {
        scale: [0.7, 1],
        opacity: [0, 1],
        ease: createSpring({ stiffness: 300, damping: 13 }),
      });
    }
  }, [done]);

  // the satisfying part: button pop, count roll, and a +1 floating away
  function tick(btn: HTMLElement) {
    if (prefersReducedMotion()) return;
    springPop(btn, 1.15);
    if (countRef.current) {
      animate(countRef.current, {
        translateY: [7, 0],
        opacity: [0, 1],
        duration: 300,
        ease: "outQuad",
      });
    }
    const row = rowRef.current;
    if (!row) return;
    const float = document.createElement("span");
    float.textContent = "+1";
    float.setAttribute("aria-hidden", "true");
    float.className =
      "pointer-events-none absolute -top-1.5 left-0 text-xs font-bold text-accent";
    row.appendChild(float);
    animate(float, {
      translateY: [0, -16],
      opacity: [1, 0],
      duration: 650,
      ease: "outQuad",
      onComplete: () => float.remove(),
    });
  }

  async function log(body: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, ...body }),
      });
      const data = await res.json().catch(() => ({}));
      return Boolean(res.ok && data.ok);
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function bump(btn: HTMLElement) {
    const next = current + 1;
    if (total && next > total) return complete();
    setCurrent(next); // optimistic
    tick(btn);
    if (await log({ progress: next })) {
      setUndoable(true);
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => {
        setUndoable(false);
        router.refresh();
      }, 6000);
    } else {
      setCurrent(next - 1);
    }
  }

  async function undo() {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoable(false);
    const prev = current - 1;
    setCurrent(prev);
    if (!(await log({ progress: prev }))) setCurrent(prev + 1);
    router.refresh();
  }

  async function complete() {
    setDone(true); // optimistic
    const body: Record<string, unknown> = { status: "COMPLETED" };
    if (total) body.progress = total;
    if (await log(body)) {
      setTimeout(() => router.refresh(), 900);
    } else {
      setDone(false);
    }
  }

  if (done) {
    return (
      <p
        ref={doneRef}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-soft"
      >
        <Check size={13} weight="bold" /> Completed
      </p>
    );
  }

  return (
    <div ref={rowRef} className="relative flex items-center gap-1.5">
      <span ref={countRef} className="text-xs tabular-nums text-faint">
        {current}
        {total ? ` / ${total}` : ""} {unit}
      </span>
      {undoable ? (
        <button
          type="button"
          onClick={undo}
          className="rounded-full border border-white/15 px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-white/30 hover:text-paper"
        >
          Undo
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => bump(e.currentTarget)}
          disabled={busy}
          aria-label={`Log ${unit === "ep" ? "next episode" : "next chapter"}`}
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-ink transition-all duration-300 hover:bg-accent-soft active:scale-[0.97]",
            busy && "opacity-60",
          )}
        >
          <Plus size={12} weight="bold" /> 1
        </button>
      )}
      <button
        type="button"
        onClick={complete}
        disabled={busy}
        aria-label="Mark completed"
        className="grid size-6 place-items-center rounded-full border border-white/15 text-muted transition-colors hover:border-accent/50 hover:text-accent-soft"
      >
        <Check size={12} weight="bold" />
      </button>
    </div>
  );
}
