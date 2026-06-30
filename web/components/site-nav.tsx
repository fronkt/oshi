"use client";

import { useState } from "react";
import { List, X } from "@phosphor-icons/react/dist/ssr";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#compat", label: "Compatibility" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4">
      <nav className="mx-auto mt-4 flex h-14 max-w-[1080px] items-center justify-between rounded-full border border-white/10 bg-ink/55 pl-5 pr-2 backdrop-blur-xl">
        <a href="#top" className="flex items-center gap-2.5" aria-label="Oshi home">
          <span className="grid size-7 place-items-center rounded-lg bg-accent text-ink">
            <span className="font-jp text-[15px] font-bold leading-none">推</span>
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Oshi</span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted transition-colors duration-300 hover:text-paper"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href="#waitlist"
            className="hidden rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white active:scale-[0.98] sm:inline-block"
          >
            Get early access
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid size-10 place-items-center rounded-full text-paper md:hidden"
          >
            {open ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="mx-auto mt-2 max-w-[1080px] rounded-3xl border border-white/10 bg-ink/90 p-3 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-2xl px-3 py-3 text-[15px] text-muted transition-colors hover:bg-white/5 hover:text-paper"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#waitlist"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-full bg-paper px-4 py-3 text-center text-sm font-semibold text-ink"
            >
              Get early access
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
