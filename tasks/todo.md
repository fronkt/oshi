# Oshi — Build Plan

Source of truth for scope: [`SPEC.md`](../SPEC.md). Decisions locked via grilling (2026-06-29).

## Status
- [x] Startup analysis (market / college-app verdict) — see SPEC §1
- [x] AniList API verification (feed, write, auth, rate limit) — see SPEC §4
- [x] Product grilling → 7 locked decisions — see SPEC §3
- [x] SPEC.md written
- [ ] **CHECK-IN: confirm spec + remaining defaults before scaffolding** ← we are here
- [ ] Verify AniList ToS allows commercial social use
- [ ] Final grant-type call (implicit vs auth-code) for token custody

## Phase 0 — Scaffold
- [ ] Expo app (TS) + dev build (not Expo Go — widgets need native)
- [ ] Supabase project + schema (SPEC §5)
- [ ] AniList GraphQL client (POST graphql.anilist.co, 429 backoff)
- [ ] Secrets/env wiring (AniList client id/secret, Supabase keys, encryption key)

## Phase 1 — Auth + import + feed
- [ ] AniList OAuth flow + token storage (encrypted, server-side)
- [ ] Import follows + their public activity (`Page.activities isFollowing:true`)
- [ ] Mirror into Supabase; render open feed
- [ ] React-to-anyone: pending reactions + invite hook for non-users

## Phase 2 — Logger widget + writes
- [ ] Interactive widget (iOS App Intents / Android Glance)
- [ ] `SaveMediaListEntry` write path: device → Oshi API → AniList → mirror
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
