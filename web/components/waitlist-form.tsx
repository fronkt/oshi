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
          "flex items-center gap-3 rounded-full border border-accent/30 bg-accent/10 p-2 pr-5",
          className,
        )}
        role="status"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-ink">
          <Check size={17} weight="bold" />
        </span>
        <p className="text-sm text-paper">
          You are on the list. We will email your invite when your spot opens.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("w-full", className)} noValidate>
      {/* double-bezel pill: input + button-in-button live in one machined shell */}
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-surface/70 p-1.5 backdrop-blur-md transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/15">
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
          className="min-w-0 flex-1 bg-transparent px-4 py-2 text-[15px] text-paper outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-accent py-2 pl-4 pr-2 text-[14px] font-semibold text-ink transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-accent-soft active:scale-[0.98] disabled:opacity-70"
        >
          <span className="hidden sm:inline">Get early access</span>
          <span className="sm:hidden">Join</span>
          <span className="grid size-7 place-items-center rounded-full bg-ink/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
            {state === "loading" ? (
              <CircleNotch size={15} weight="bold" className="animate-spin" />
            ) : (
              <ArrowRight size={15} weight="bold" />
            )}
          </span>
        </button>
      </div>
      {state === "error" && (
        <p className="mt-2 pl-4 text-sm text-accent-soft" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
