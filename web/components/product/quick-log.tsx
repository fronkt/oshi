"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

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

  async function bump() {
    const next = current + 1;
    if (total && next > total) return complete();
    setCurrent(next); // optimistic
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
      <p className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-soft">
        <Check size={13} weight="bold" /> Completed
      </p>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs tabular-nums text-faint">
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
          onClick={bump}
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
