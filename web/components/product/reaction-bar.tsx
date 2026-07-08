"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { REACTION_EMOJI } from "@/lib/emoji";

export type ReactionCount = { emoji: string; n: number; mine: boolean };

/**
 * Emoji reaction chips under a feed activity. Optimistic toggle; if the target
 * isn't on Oshi yet the server stores it `pending` and we surface the invite
 * hook line once.
 */
export function ReactionBar({
  activityId,
  targetAnilistId,
  initial,
}: {
  activityId: number;
  targetAnilistId: number;
  initial: ReactionCount[];
}) {
  const [counts, setCounts] = useState<Record<string, { n: number; mine: boolean }>>(
    () => {
      const m: Record<string, { n: number; mine: boolean }> = {};
      for (const e of REACTION_EMOJI) m[e] = { n: 0, mine: false };
      for (const c of initial) m[c.emoji] = { n: c.n, mine: c.mine };
      return m;
    },
  );
  const [pendingNote, setPendingNote] = useState(false);
  const [open, setOpen] = useState(false);

  async function toggle(emoji: string) {
    const cur = counts[emoji];
    const next = cur.mine
      ? { n: Math.max(0, cur.n - 1), mine: false }
      : { n: cur.n + 1, mine: true };
    setCounts((c) => ({ ...c, [emoji]: next })); // optimistic
    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, targetAnilistId, emoji }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error();
      if (data.state === "pending") setPendingNote(true);
    } catch {
      setCounts((c) => ({ ...c, [emoji]: cur })); // roll back
    }
  }

  const active = REACTION_EMOJI.filter((e) => counts[e].n > 0);
  const shown = open ? [...REACTION_EMOJI] : active;

  return (
    <div className="mt-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {shown.map((emoji) => {
          const c = counts[emoji];
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => toggle(emoji)}
              aria-pressed={c.mine}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[13px] leading-none transition-colors duration-300",
                c.mine
                  ? "border-accent/50 bg-accent/15 text-paper"
                  : "border-white/10 bg-white/[0.04] text-muted hover:border-white/25 hover:text-paper",
              )}
            >
              <span aria-hidden>{emoji}</span>
              {c.n > 0 && <span className="font-medium tabular-nums">{c.n}</span>}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fewer reactions" : "Add reaction"}
          className="inline-flex size-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[13px] leading-none text-muted transition-colors duration-300 hover:border-white/25 hover:text-paper"
        >
          {open ? "−" : "+"}
        </button>
      </div>
      {pendingNote && (
        <p className="mt-2 text-xs text-accent-soft">
          Saved — they are not on Oshi yet, so they will see it the moment they join.
        </p>
      )}
    </div>
  );
}
