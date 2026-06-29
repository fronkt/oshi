# Oshi — Product & Build Spec (v0)

**推し (oshi)** — the one you stan. A social layer on top of your anime/manga taste:
see what your friends are watching/reading, log your own progress one-tap from your
home screen, and find the people whose taste matches yours.

> **Thesis:** Airbuds proved that an *effortless social layer on a streaming identity*
> is a 5M-MAU, fundable product. Nobody has run that playbook on anime — and anime
> taste is a *stronger* identity/tribe signal than music for Gen Z. Oshi is that bet.

---

## 1. Why now (market read)

- **Demographic fit is A+.** 54% of Gen Z globally self-identify as anime fans (ahead of
  Kendrick, ~tied with Beyoncé); 50% watch weekly. ~750–800M viewers worldwide. Anime
  taste is an *identity* marker for the exact cohort that adopts viral social apps.
- **The social lane is vacant.** AniList has activity feeds but ignores the mobile-social/
  widget surface. Kitsu (the one social-forward tracker) is dying. MAL was acquired by a
  Web3/AI company (Gaudiy) and is likely distracted. Nobody runs the *widget* mechanic.
- **Playbook is freshly proven & funded.** Airbuds: 15M downloads, 5M MAU, **1.5M DAU
  (30% DAU/MAU — strong stickiness)**, $10M from a16z / Seven Seven Six / Nikita Bier.

**Verdict:** worth a committed, **time-boxed** v0 swing. High-variance consumer-social bet;
the logging problem caps casual reach; but the downside is capped because read+write v0 is
cheap to ship. **Kill metric (set now):** seed 1–2 anime Discords — do returning users open
Oshi *un-pinged* within ~2 weeks? If no → stop, little spent.

**College-app note:** this is an *entrepreneurship/impact* credential, **not** a research/STS
one — keep it separate from STS2027 research time. Its admissions value scales with
*traction*; profile is high-ceiling / low-floor, a complement to (not replacement for)
the reliable research credential. Authenticity multiplier: only works if genuinely embedded
in anime communities (that's the distribution).

---

## 2. The core risk model (read this before building anything)

Music auto-scrobbles — Airbuds gets activity signal for free. **Anime does not.** Sparse
activity is *the* make-or-break risk. The whole v0 design is engineered around it:

| Risk | How v0 attacks it |
|------|-------------------|
| **Signal sparsity** (no "now playing") | The **one-tap Logger widget manufactures the signal** — frictionless home-screen logging generates the activity the social feed consumes. |
| **Cold start** (empty feed kills social apps) | **Open feed**: AniList following-activity is *public*, so we surface everyone you already follow → full feed minute one, before any friend installs Oshi. Plus the Logger is useful *solo*. |
| **Retention** | Daily logging habit + ambient friend presence on the home screen. |
| **Dependency on AniList** (free, degraded 30/min, ToS forbids hoarding) | **Cache, don't mirror** — short-TTL serving cache only (ToS bans data hoarding); per-user-token reads; multi-source-ready. *(MAL is a roadmapped 2nd source — its API has no social feed, so AniList is the v0 foundation.)* |

---

## 3. Locked decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | **Platform** | Expo / React Native (native, home-screen-widget-capable, reuses TS) |
| 2 | **Widget** | Two modes — **Social** (active friends + recent fallback) & **Logger** (media-player UI, one-tap write) |
| 3 | **v0 scope** | Read **+ write** (the Logger is the signal-generating wedge) |
| 4 | **Social graph** | **Open feed** — mirror AniList follows' *public* activity; **react-to-anyone** → non-user reactions stored *pending* + invite hook |
| 5 | **Compat score** | **Niche-weighted blend** (overlap + taste-vector cosine + score-correlation) + a human "why" line; tone-engine-upgradeable |
| 6 | **Reactions** | **Sticker system** — *user-imported* (UGC/host model, à la Discord); small original default pack free |
| 7 | **Invite loop** | Gate **custom-sticker importing + full weekly recap**; *core value stays free*; non-user compat = natural invite trigger |
| 8 | **Platform source** | **AniList-first** (only API with a friend-activity feed); MAL roadmapped as a 2nd source (v1.5+) for logging + identity, **not v0** |

### Defaulted plumbing (redline-able)
- **Data/sync (cache-not-mirror):** persist only Oshi-native data; AniList content lives in a
  **short-TTL serving cache** (ToS forbids mirroring/hoarding). The server fetches each user's
  following-feed with **that user's own token** (so the 30/min cap is per-user, not global); refresh
  on app-open + a background tick. Backoff on 429 via `Retry-After`.
- **Backend:** **Supabase Edge Functions (Deno)** — token custody co-located with the encrypted DB.
- **Token custody:** store AniList tokens **server-side, encrypted at rest**; the device/widget
  holds only an *Oshi* session token. One-tap writes go **device → Oshi API → AniList**, so
  full-access AniList tokens never live on the device or reach the client.
- **Onboarding:** AniList OAuth (**authorization-code grant**; server holds the token) via in-app
  browser → load follows + public activity → instant populated feed → prompt to add the widget → optional invite.
- **Recap:** weekly auto-generated shareable image (chapters/episodes logged, top genre, your
  highest compat match of the week, one flex stat); one-tap share to IG story / Discord.

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Device (Expo / React Native)                                │
│   • App: onboarding, feed, compat, sticker reactions, recap  │
│   • Widgets (interactive, iOS 17+ App Intents / Android      │
│     Glance):  [Social]  and  [Logger ⏮ ⊕NEXT ✓]              │
│   • Holds ONLY an Oshi session token (in App Group keychain) │
└───────────────┬─────────────────────────────────────────────┘
                │  HTTPS (Oshi session token)
┌───────────────▼─────────────────────────────────────────────┐
│  Oshi backend  (Supabase Edge Functions · Deno)             │
│   • Holds AniList tokens (encrypted at rest)                 │
│   • Cache (short TTL): following-activity per user (token)   │
│   • Write path: Logger tap → SaveMediaListEntry → cache      │
│   • Compat engine (niche-weighted blend)                    │
│   • Reactions / invites / recap generation                  │
└───────────────┬─────────────────────────────────────────────┘
                │
        ┌───────▼────────┐        ┌──────────────────────────┐
        │ Supabase       │        │ AniList GraphQL          │
        │ (app state +   │        │ graphql.anilist.co       │
        │  TTL cache)    │        │ • Page.activities(       │
        └────────────────┘        │     isFollowing:true)    │
                                  │ • SaveMediaListEntry      │
                                  │ • 30 req/min (degraded)   │
                                  └──────────────────────────┘
```

**AniList API facts (verified):**
- Friend feed: `Page.activities(isFollowing: true)` → `ListActivity { user, media, progress, status, createdAt }` (public).
- Write: `SaveMediaListEntry(mediaId, status, progress, score)` — needs a token; powers one-tap logging.
- Auth: Implicit grant (no secret) or Authorization Code (server, with secret). **Tokens are
  all-or-nothing — no granular scopes**, so "read-only" was always a product choice, not an auth limit.
- Rate limit: **30 req/min (officially degraded from 90)** — design as if scarce.

---

## 5. Data model (Supabase) — sketch

**Persisted (Oshi-native):**
- `users` — oshi user id, anilist_id, anilist_name, avatar, **anilist_token_enc**, created_at
- `oshi_sessions` — device session tokens (the *only* token the app/widget holds)
- `follows` — Oshi-native follow edges (seeded from AniList follows); `is_oshi_user` flag
- `reactions` — from_user, target_activity (or target_anilist_user for pending), sticker_id, **pending** bool, created_at
- `sticker_packs` / `stickers` — packs; `is_default`; user-imported (UGC) vs default
- `compat_cache` — pair scores: user_a, user_b, score, why_json, computed_at
- `invites` — inviter, code, invitee_anilist_id?, redeemed_at
- `recaps` — user_id, week, stats_json, image_url, unlocked bool

**Cache (short-TTL, NOT a mirror — ToS forbids hoarding):**
- `anilist_cache` — key, payload jsonb, fetched_at, **expires_at**. AniList content (activity, media)
  is fetched live per user with their token and cached *only* to respect the rate limit; evicted on
  expiry. **No permanent `activity`/`media` warehouse.**

---

## 6. Compat score (formula detail)

`score(A,B) = w1·nicheOverlap + w2·tasteVectorCosine + w3·scoreCorrelation`  → 0–100

- **nicheOverlap** — Jaccard over shared titles, each title weighted by inverse popularity
  (sharing an obscure title >> both reading One Piece).
- **tasteVectorCosine** — per-user genre/tag vector weighted by their ratings; cosine between users.
- **scoreCorrelation** — Pearson over titles *both* rated (do you agree on what's good?).
- **why-line** — generated from the top contributing signals: *"92% — you both rate dark+hopeful
  seinen highest, and you both love Oyasumi Punpun (niche)."*
- **Upgrade slot:** the mangamood **tone engine** later adds a 4th component (vibe-vector cosine)
  → "vibe compatibility" with **zero UX change**. This is the v2 moat.

---

## 7. v0 feature scope

1. **Auth + import** — connect AniList, mirror follows + their public activity.
2. **Feed** — open, chronological friend activity; react-to-anyone (pending + invite hook).
3. **Logger widget** — media-player UI, one-tap `SaveMediaListEntry` (▶ start / ⏭ +1 / ⏮ −1 /
   ⏸ pause / ✓ complete); in-app activity log with **undo** for misclicks.
4. **Social widget** — active friends now; graceful fallback to recent activity / a compat
   highlight so it's **never empty**.
5. **Compat** — score + why-line per friend; free for on-Oshi users, teased for non-users.
6. **Sticker reactions** — default pack free; custom packs invite-gated.
7. **Weekly recap** — shareable card; blurred teaser until ~3 invites.
8. **Invite loop** — share link; non-user reactions/compat as natural triggers.

---

## 8. Guardrails (non-negotiable)

- **Stickers = user-imported (UGC / host model).** Users import their own stickers (anime images
  from anywhere — Pinterest, etc.); Oshi *hosts*, doesn't sell or curate them. This is the
  Discord/Telegram posture and keeps Oshi under **DMCA safe harbor** — valid as long as Oshi
  (a) registers a DMCA agent, (b) honors notice-and-takedown, (c) keeps a repeat-infringer policy,
  and (d) does **not** itself ship/monetize a curated pack of copyrighted art. The one small
  *default* pack Oshi distributes stays original/licensed (for that pack, Oshi is the distributor,
  not a host). Invite-gated "custom stickers" = the *feature of importing your own*, not Oshi-curated content.
- **Token custody.** AniList tokens encrypted at rest, **never** on device, **never** client-exposed.
  We are custodian of full AniList account access — treat accordingly.
- **No content, ever.** Metadata + activity + recommendations only. Link only to legal sources
  (AniList, official publishers). Never scanlation sites.
- **Respect AniList.** 30 req/min; per-user-token reads to distribute the cap; backoff on 429.
  **Cache, never mirror/hoard** (ToS). Never spam non-users via the AniList API. Free under
  **$150/mo revenue**; above that, get a commercial license (`contact@anilist.co`). Email AniList to
  authorize Oshi under the **tracker-clause exception** (complementary sync, not a competing tracker).
- **Multi-source ready.** Source-abstract the activity/catalog layer. **AniList-first** (only API
  with a friend-activity feed); **MAL is a roadmapped 2nd source** (v1.5+) for logging + identity —
  its API supports writes + OAuth but has no social graph, so MAL users get an Oshi-native follow graph.

---

## 9. Build phases

- **Phase 0 — Scaffold.** Expo app (TS, CNG/dev-build) + **EAS builds (iOS+Android)** + a
  **placeholder-widget de-risk spike** + Supabase project & **cache-not-mirror schema** + AniList
  client + secrets. Detailed plan: [`docs/PHASE0_PLAN.md`](./docs/PHASE0_PLAN.md).
- **Phase 1 — Auth + import + feed.** OAuth, mirror follows+activity, render open feed.
- **Phase 2 — Logger widget + writes.** Interactive widget, `SaveMediaListEntry`, undo log.
- **Phase 3 — Compat + stickers.** Blend score + why-line; sticker reactions + pending/invite.
- **Phase 4 — Recap + invite loop.** Weekly card, share, gating.
- **Phase 5 — Polish + seed.** Social widget fallback states, onboarding polish, seed 1–2 Discords.
- **v2 (moat) — Tone engine.** Slot mangamood's tone-fingerprint vibe-vector into compat + add
  "what should we watch together" (friend-group tone centroid under everyone's content filters).

---

## 10. Open items (to resolve before / during build)

- [x] **AniList ToS — verified.** Commercial OK under **$150/mo** (license above); **no data
      hoarding** → cache-not-mirror; **tracker-clause exception** → email `contact@anilist.co` to
      authorize Oshi as complementary sync.
- [x] **Grant type — resolved: authorization-code** (server holds the token for reads + writes).
- [ ] **Token-encryption mechanism** — Supabase Vault/pgsodium vs app-level AES in the edge fn.
- [ ] **AniList app registration** — client id/secret + redirect-URI scheme (`oshi://` vs https).
- [ ] **Recap card visual design** — layout, brand, share targets.
- [ ] **Sticker model hygiene** — user-import flow (UGC); small original *default* pack; register a
      DMCA agent + notice-and-takedown + repeat-infringer policy to keep safe-harbor protection.
- [ ] **Push channel** — for "reactions waiting" / friend-joined nudges (Expo push).
