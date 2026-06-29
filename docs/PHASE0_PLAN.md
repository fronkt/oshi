# Oshi — Phase 0 Scaffold Plan

## Context

`fronkt/oshi` currently holds only docs (`SPEC.md`, `README.md`, `tasks/`). Phase 0 builds the
**foundation every later phase sits on**, and does it in a way that respects two hard constraints
surfaced during planning:

1. **AniList ToS (verified):** "Using the API as backup/data storage is prohibited. Hoarding or
   mass collection is prohibited." → The spec's "mirror everything into Supabase" is **not allowed**.
   Phase 0 bakes in a **cache-not-mirror** model: persist only Oshi-native data; treat AniList
   content as a **short-TTL serving cache**. (Also: free under $150/mo revenue; tracker-clause
   exception requires we email AniList positioning Oshi as complementary sync — action item, non-blocking.)
2. **Widgets are the product** and require native code via config plugins applied during prebuild
   (CNG) → the app must be a **dev build from day zero, never Expo Go**. Per user: **EAS cloud builds
   for iOS + Android both**, Apple Developer Program now.

The highest-risk technical unknown is "can a home-screen widget actually build and render from an
Expo app." Phase 0 therefore includes a **placeholder-widget spike** as its exit gate — we prove the
native pipeline on both platforms *before* investing in features.

**Outcome:** a running dev-build Expo app on both stores' test tracks, a placeholder widget on the
home screen, a ToS-compliant Supabase schema, a working AniList GraphQL client, and secrets wired —
ready for Phase 1 (auth + feed).

## Decisions baked in (from grilling + research)

- **App:** Expo (latest SDK, ~53) + TypeScript + **expo-router**; CNG/prebuild (no committed native dirs).
- **Builds:** **EAS Build (cloud), iOS + Android**; `development` client profile; Apple Developer
  Program ($99/yr); TestFlight + Play internal track.
- **Widgets:** `expo-widgets` (iOS WidgetKit / SwiftUI target via `expo-target.config.js` + App Group)
  + `react-native-android-widget` (Android). Placeholder only in Phase 0.
- **Backend:** **Supabase Edge Functions (Deno)** — token custody co-located with the encrypted DB,
  secrets built-in, no extra deploy. *(Alt considered: Next.js API on Vercel — more familiar but a
  second deploy + cross-service auth. Recommending Edge Functions for v0; easy to revisit.)*
- **Auth:** **authorization-code OAuth** (server holds the AniList token; device holds only an Oshi
  session). Phase 0 scaffolds the client + secrets; the full flow is Phase 1.
- **Data:** cache-not-mirror; AniList token column encrypted (Supabase Vault / pgsodium); RLS on all tables.
- **AniList client:** port from moodmanga `scripts/anilist.ts` (already has 429 + `Retry-After`
  backoff, media fields, `stripHtml`, `topTags`); per-user-token, 30/min-aware.
- **Platform source: AniList-first.** AniList is the **only** API exposing the friend-activity
  feed Oshi's open feed needs. MAL's API v2 has writes (`PATCH my_list_status`) + OAuth but **no
  social graph / activity feed** — so it can't power the core mechanic. **MAL noted as a roadmapped
  second source (v1.5+)** for logging + identity + reach, paired with an Oshi-native follow graph so
  MAL users aren't second-class. Not in v0.

## Steps

> **Execution order:** **Step 0 = GitHub checkpoint** — fold the ToS (cache-not-mirror) + the 3 ToS
> constraints + the AniList-first/MAL-second decision into `SPEC.md` and `tasks/todo.md`, save this
> plan into the repo (`docs/PHASE0_PLAN.md`), and push, so the planning work can't be lost. The
> heavier scaffolding below (EAS setup, **Apple Developer enrollment $99/yr**, AniList app
> registration) is **outward-facing + costs money**, so it's gated behind an explicit go-ahead after
> the checkpoint.

### 1. Project init & tooling
- `create-expo-app` (TS) **into** the existing `C:\Users\frank\oshi` (preserve docs); add expo-router,
  eslint/prettier, typed `app.config.ts`. Expo `.gitignore`.

### 2. EAS + native pipeline (both platforms)
- `eas.json` (development / preview / production); `eas build:configure`.
- Bundle id `com.oshi.app`; iOS App Group `group.com.oshi.app`.
- Apple Developer enrollment + EAS-managed credentials; first dev build iOS + Android → install on device.

### 3. Widget de-risk spike  ← **Phase 0 exit gate**
- `expo-widgets` + `expo-target.config.js` (iOS WidgetKit target, App Group) → static "Oshi" SwiftUI widget.
- `react-native-android-widget` → placeholder Android widget.
- Prebuild + EAS dev build; **confirm the widget renders on the home screen on iOS AND Android.**

### 4. Supabase + schema (cache-not-mirror)
- Create project. `supabase/migrations/0001_init.sql`:
  - **Oshi-native (persisted):** `users` (incl. `anilist_token_enc`), `oshi_sessions`, `reactions`,
    `sticker_packs`, `stickers`, `invites`, `compat_cache`, `recaps`.
  - **Cache (TTL, NOT mirror):** `anilist_cache(key, payload jsonb, fetched_at, expires_at)` — explicit
    serving cache + eviction, with a comment citing the ToS no-hoarding rule. **No** permanent
    `activity`/`media` warehouse tables.
  - Encrypt `anilist_token_enc` via Supabase Vault/pgsodium; **RLS on every table**.

### 5. AniList client — `lib/anilist.ts`
- Port moodmanga client; add typed ops: `viewer()`, `following(userId)`,
  `followingActivity(page)` (`Page.activities isFollowing:true`), `saveProgress(mediaId,status,progress)`
  (`SaveMediaListEntry`). Takes a token arg; rate-limit aware.

### 6. Backend skeleton — `supabase/functions/`
- `health/index.ts` (returns ok, reads a secret) to prove edge-function deploy + secrets.
- Wire secrets: `ANILIST_CLIENT_ID/SECRET/REDIRECT_URI`, `TOKEN_ENC_KEY`, service role. (OAuth
  code-exchange fn is Phase 1 — only stub the structure now.)

### 7. Env / secrets / config
- `.env.example`: client-safe vars as `EXPO_PUBLIC_*`; **server secrets live in Supabase function
  secrets, never in the app bundle.**
- Register an AniList API client (anilist.co/settings/developer) → id/secret + redirect URI; document in README.

### 8. Docs
- Rewrite `SPEC.md` §4–5 to **cache-not-mirror** + the 3 ToS constraints + AniList-authorization-email item.
- Tick Phase 0 items in `tasks/todo.md`; add EAS/Apple + ToS-email tasks.

## Critical files
| File | Purpose |
|------|---------|
| `app.config.ts`, `eas.json`, `expo-target.config.js` | Expo config, EAS profiles, iOS widget target |
| `app/` (expo-router: `_layout.tsx`, `index.tsx`) | App skeleton |
| `widgets/` (iOS SwiftUI + Android placeholder) | Widget de-risk spike |
| `lib/anilist.ts` | AniList GraphQL client (ported from moodmanga) |
| `supabase/migrations/0001_init.sql` | Cache-not-mirror schema + RLS |
| `supabase/functions/health/index.ts` | Edge-function + secrets proof |
| `.env.example`, `.gitignore` | Secrets template |
| `SPEC.md`, `tasks/todo.md` (edit) | ToS-revised architecture + progress |

## Reuse (don't reinvent)
- moodmanga `scripts/anilist.ts` → `lib/anilist.ts` (429 backoff, `MEDIA_FIELDS`, `stripHtml`, `topTags`).
- moodmanga `lib/tone.ts` → **not** needed until v2 (the tone-engine moat).

## Verification (end-to-end)
1. `npx expo prebuild` succeeds; no native dirs committed.
2. `eas build --profile development` iOS + Android succeed; install on a device.
3. **Placeholder widget appears on the home screen on both platforms** (the make-or-break proof).
4. `supabase db reset` applies `0001_init` cleanly; RLS enabled.
5. Dev script calls `followingActivity` for a known public AniList user → returns activity (read-only,
   no token) — proves the client + 429 handling.
6. `health` edge function deploys + returns ok reading a secret.
7. `npx tsc --noEmit` + lint pass.
8. Commit + push (specific paths per workflow).

## Open items (resolve during Phase 0, non-blocking)
- [ ] Email `contact@anilist.co` — authorize Oshi as a complementary sync service (tracker-clause exception).
- [ ] Confirm token-encryption mechanism (Supabase Vault vs app-level AES in the edge fn).
- [ ] Final bundle id / App Group naming.
- [ ] AniList client redirect-URI scheme (custom scheme `oshi://` vs https).

## Out of scope for Phase 0 (later phases)
OAuth flow + import + feed (P1) · logger widget writes (P2) · compat + stickers (P3) · recap + invite
loop (P4) · seed + kill-metric (P5) · tone-engine vibe-compat (v2).
