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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/8 bg-ink/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 sm:px-8">
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
              className="text-sm text-muted transition-colors hover:text-paper"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#waitlist"
            className="hidden rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink transition active:translate-y-px hover:bg-white sm:inline-block"
          >
            Get early access
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-lg text-paper md:hidden"
          >
            {open ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-white/8 bg-ink/95 px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-[15px] text-muted transition-colors hover:bg-white/5 hover:text-paper"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#waitlist"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-full bg-paper px-4 py-2.5 text-center text-sm font-semibold text-ink"
            >
              Get early access
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
