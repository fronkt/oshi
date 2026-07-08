import Link from "next/link";

const MESSAGES: Record<string, string> = {
  required: "Sign in to open the app.",
  failed: "AniList sign-in did not complete — give it another try.",
  soon: "Sign-in opens soon. Join the waitlist and we will let you know.",
};

/** Small status banner driven by /?auth=… redirects from the auth routes. */
export function AuthNotice({ code }: { code: string }) {
  const msg = MESSAGES[code];
  if (!msg) return null;
  return (
    <div className="fixed inset-x-0 top-[84px] z-40 flex justify-center px-4">
      <p className="flex items-center gap-3 rounded-full border border-accent/30 bg-ink/85 py-2 pl-4 pr-2 text-sm text-paper shadow-lg backdrop-blur-xl">
        {msg}
        <Link
          href="/"
          aria-label="Dismiss"
          className="grid size-6 place-items-center rounded-full bg-white/10 text-xs text-muted transition-colors hover:text-paper"
        >
          ✕
        </Link>
      </p>
    </div>
  );
}
