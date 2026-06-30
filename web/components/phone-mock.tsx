"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  Play,
  SkipBack,
  SkipForward,
  Check,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";

type Activity = {
  name: string;
  handle: string;
  avatar: string;
  action: string;
  title: string;
  poster: string;
  reactions: string[];
};

const FEED: Activity[] = [
  {
    name: "Mei",
    handle: "meiwatches",
    avatar: "https://i.pravatar.cc/96?img=47",
    action: "finished",
    title: "Frieren: Beyond Journey's End",
    poster: "https://picsum.photos/seed/frieren-oshi/160/220",
    reactions: ["🔥", "😭"],
  },
  {
    name: "Kenji",
    handle: "kenji_w",
    avatar: "https://i.pravatar.cc/96?img=68",
    action: "watched ep 8 of",
    title: "Vinland Saga",
    poster: "https://picsum.photos/seed/vinland-oshi/160/220",
    reactions: ["⭐"],
  },
];

export function PhoneMock() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto w-full max-w-[320px]"
    >
      {/* glow behind the device */}
      <div className="pointer-events-none absolute -inset-8 -z-10 bloom-accent opacity-70" />

      <div className="rounded-[2.6rem] border border-white/12 bg-elev p-2.5 shadow-[0_40px_120px_-30px_rgba(255,46,116,0.35)]">
        <div className="relative overflow-hidden rounded-[2.1rem] bg-ink">
          {/* status bar */}
          <div className="flex items-center justify-between px-6 pt-3.5 pb-2 text-[11px] font-medium text-paper/80">
            <span>9:41</span>
            <span className="font-jp text-faint">推し</span>
          </div>

          {/* app header */}
          <div className="flex items-center justify-between px-5 pb-3">
            <h3 className="font-display text-lg font-semibold tracking-tight">Feed</h3>
            <span className="size-7 rounded-full bg-linear-to-br from-accent to-accent-soft" />
          </div>

          {/* compatibility banner */}
          <div className="mx-4 mb-3 flex items-center justify-between rounded-2xl border border-accent/25 bg-accent/10 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <Sparkle size={15} weight="fill" className="text-accent" />
              <span className="text-[13px] text-paper">You and Mei</span>
            </div>
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-[12px] font-bold text-ink">
              92% match
            </span>
          </div>

          {/* feed */}
          <div className="space-y-2.5 px-4 pb-2">
            {FEED.map((a) => (
              <div
                key={a.handle}
                className="rounded-2xl border border-white/8 bg-surface/80 p-3"
              >
                <div className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.avatar}
                    alt={`${a.name} avatar`}
                    width={36}
                    height={36}
                    className="size-9 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-snug">
                      <span className="font-semibold text-paper">{a.name}</span>{" "}
                      <span className="text-muted">{a.action}</span>
                    </p>
                    <p className="truncate text-[13px] font-medium text-accent-soft">
                      {a.title}
                    </p>
                    <p className="text-[11px] text-faint">@{a.handle}</p>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.poster}
                    alt=""
                    width={40}
                    height={54}
                    className="h-[54px] w-10 shrink-0 rounded-md object-cover"
                  />
                </div>
                <div className="mt-2.5 flex gap-1.5">
                  {a.reactions.map((r, i) => (
                    <span
                      key={i}
                      className="grid size-6 place-items-center rounded-full border border-white/10 bg-ink text-[12px]"
                    >
                      {r}
                    </span>
                  ))}
                  <span className="grid size-6 place-items-center rounded-full border border-dashed border-white/15 text-[13px] text-faint">
                    +
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* logger bar */}
          <div className="m-4 mt-2 rounded-2xl border border-white/10 bg-elev p-3">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.16em] text-faint">
                  Now watching
                </p>
                <p className="truncate text-[13px] font-semibold text-paper">
                  Frieren, ep 13
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="grid size-8 place-items-center rounded-full text-muted" aria-hidden>
                  <SkipBack size={15} weight="fill" />
                </button>
                <motion.span
                  animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  className="grid size-9 place-items-center rounded-full bg-accent text-ink"
                >
                  <Play size={16} weight="fill" />
                </motion.span>
                <button className="grid size-8 place-items-center rounded-full text-muted" aria-hidden>
                  <SkipForward size={15} weight="fill" />
                </button>
                <button className="grid size-8 place-items-center rounded-full border border-white/10 text-paper" aria-hidden>
                  <Check size={15} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
