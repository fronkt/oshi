# Oshi — Build Plan

Source of truth for scope: [`SPEC.md`](../SPEC.md). Decisions locked via grilling (2026-06-29).

## Status
- [x] Startup analysis (market / college-app verdict) — see SPEC §1
- [x] AniList API verification (feed, write, auth, rate limit) — see SPEC §4
- [x] Product grilling → 7 locked decisions — see SPEC §3
- [x] SPEC.md written
- [x] AniList ToS verified → **cache-not-mirror**; $150/mo commercial threshold; tracker-clause email
- [x] Grant-type resolved → **authorization-code** (server holds token)
- [x] Platform source → **AniList-first**; MAL roadmapped 2nd source (v1.5+)
- [x] Phase 0 plan approved → [`docs/PHASE0_PLAN.md`](../docs/PHASE0_PLAN.md)
- [ ] **GATE: heavy scaffolding (EAS, Apple Dev $99/yr, AniList app reg) awaits go-ahead** ← we are here

## Phase 0 — Scaffold  (plan: docs/PHASE0_PLAN.md)
- [ ] Expo app (TS, expo-router, CNG/dev-build — never Expo Go)
- [ ] EAS Build configured (iOS+Android); Apple Developer enrollment ($99/yr)
- [ ] **Widget de-risk spike** — placeholder widget renders on both home screens (exit gate)
- [ ] Supabase project + **cache-not-mirror** schema (Oshi-native tables + `anilist_cache` TTL) + RLS
- [ ] AniList GraphQL client (POST graphql.anilist.co, 429 backoff) — port from moodmanga
- [ ] Supabase Edge Functions skeleton (`health`) + secrets wiring
- [ ] Register AniList API client; email contact@anilist.co (tracker-clause authorization)

## Phase 1 — Auth + import + feed
- [ ] AniList OAuth flow + token storage (encrypted, server-side)
- [ ] Import follows + their public activity (`Page.activities isFollowing:true`)
- [ ] Cache (TTL) into Supabase; render open feed
- [ ] React-to-anyone: pending reactions + invite hook for non-users

## Phase 2 — Logger widget + writes
- [ ] Interactive widget (iOS App Intents / Android Glance)
- [ ] `SaveMediaListEntry` write path: device → Oshi API → AniList → cache
- [ ] In-app activity log + **undo**

## Phase 3 — Compat + stickers
- [ ] Niche-weighted blend score + why-line (SPEC §6)
- [ ] User-imported sticker system (UGC) + default pack
- [ ] DMCA safe-harbor hygiene (agent, takedown, repeat-infringer policy)

## Phase 4 — Recap + invite loop
- [ ] Weekly recap card (shareable image) + blurred-teaser gating
- [ ] Invite links; gate custom-sticker importing + full recap

## Phase 5 — Polish + seed
- [ ] Social widget fallback states (never empty)
- [ ] Onboarding polish
- [ ] Seed 1–2 anime Discords; instrument the kill metric (un-pinged return in ~2 weeks)

## v2 — Tone engine (the moat)
- [ ] Slot mangamood tone-fingerprint vibe-vector into compat (4th signal)
- [ ] "What should we watch together" — friend-group tone centroid under content filters

## Review
_(fill in as phases complete)_
