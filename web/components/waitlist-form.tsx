"use client";

import { useState } from "react";
import { ArrowRight, Check, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";

type State = "idle" | "loading" | "done" | "error";

export function WaitlistForm({
  source = "web",
  className,
}: {
  source?: string;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setState("error");
        setMessage(
          data.error === "invalid_email"
            ? "That email does not look right. Check it and try again."
            : "Something went wrong. Give it another try in a moment.",
        );
        return;
      }
      setState("done");
    } catch {
      setState("error");
      setMessage("Network hiccup. Try again in a moment.");
    }
  }

  if (state === "done") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-[var(--radius-input)] border border-accent/30 bg-accent/10 px-4 py-3.5",
          className,
        )}
        role="status"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-ink">
          <Check size={16} weight="bold" />
        </span>
        <p className="text-sm text-paper">
          You are on the list. We will email your invite when your spot opens.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("w-full", className)} noValidate>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="flex-1">
          <label htmlFor={`email-${source}`} className="sr-only">
            Email address
          </label>
          <input
            id={`email-${source}`}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === "error") setState("idle");
            }}
            required
            aria-invalid={state === "error"}
            className="w-full rounded-[var(--radius-input)] border border-white/12 bg-surface px-4 py-3.5 text-[15px] text-paper placeholder:text-muted outline-none transition focus:border-accent/60 focus:ring-2 focus:ring-accent/25"
          />
        </div>
        <button
          type="submit"
          disabled={state === "loading"}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-3.5 text-[15px] font-semibold text-ink transition active:translate-y-px disabled:opacity-70 hover:bg-accent-soft"
        >
          {state === "loading" ? (
            <CircleNotch size={18} weight="bold" className="animate-spin" />
          ) : (
            <>
              Get early access
              <ArrowRight
                size={17}
                weight="bold"
                className="transition-transform group-hover:translate-x-0.5"
              />
            </>
          )}
        </button>
      </div>
      {state === "error" && (
        <p className="mt-2 text-sm text-accent-soft" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
