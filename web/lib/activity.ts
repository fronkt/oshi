/** Client-safe formatting helpers for AniList activity (used by feed + profiles). */

/** "watched episode" + "5" -> "watched episode 5 of"; "completed" -> "completed". */
export function actionPhrase(status: string, progress: string | null): string {
  const s = status.trim();
  if (progress) {
    // AniList progress can be "5" or a range "3 - 5"
    const p = progress.includes("-") ? progress.replace(/\s*-\s*/, "–") : progress;
    return `${s} ${p} of`;
  }
  // statuses like "completed", "plans to watch", "paused watching" read fine bare
  return s;
}

export function timeAgo(unixSeconds: number): string {
  const diff = Math.max(0, Date.now() / 1000 - unixSeconds);
  if (diff < 60) return "just now";
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}
