"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

const QA = [
  {
    q: "Do I need an AniList account?",
    a: "Yes, for now. Oshi works with AniList today, so signing in brings your list and the people you follow with you. MyAnimeList support is on the way.",
  },
  {
    q: "Is it free?",
    a: "Yes. Seeing your friends, your matches, and logging your progress is free. Extras like custom sticker packs and your full weekly recap unlock when you invite a friend.",
  },
  {
    q: "What happens to my data?",
    a: "Oshi reads your public activity to build your feed and keeps only what it needs to. Your login stays encrypted on our servers and never touches your phone.",
  },
  {
    q: "Do my friends need Oshi too?",
    a: "No. Your feed shows the people you already follow on AniList from day one. Oshi just gets better as more of them join.",
  },
  {
    q: "When does it launch?",
    a: "We are rolling out invites through early access now. Add your email and we will send yours when a spot opens.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-[760px] px-5 py-24 sm:px-8 sm:py-32">
      <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
        Questions, answered.
      </h2>

      <div className="mt-10 divide-y divide-white/8 border-y border-white/8">
        {QA.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-6 py-5 text-left"
              >
                <span className="text-[17px] font-medium text-paper">{item.q}</span>
                <CaretDown
                  size={18}
                  weight="bold"
                  className={cn(
                    "shrink-0 text-muted transition-transform duration-300",
                    isOpen && "rotate-180 text-accent",
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300 ease-out",
                  isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]",
                )}
              >
                <div className="overflow-hidden">
                  <p className="max-w-[60ch] text-[15px] leading-relaxed text-muted">
                    {item.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
