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
- [x] **Batch A — code scaffold** (Expo SDK 56 app, AniList client, cache-not-mirror schema, `health` fn, widget sources) — `tsc` green, client smoke-tested live
- [x] **Pre-launch website** (`web/`, Next 16 + Tailwind v4 + Motion) — built with taste skill, `next build` green, waitlist API smoke-tested
- [ ] **GATE: Batch B — paid/outward (EAS build, Apple Dev $99/yr, AniList app reg, Supabase project) awaits go-ahead**

## Phase 0 — Scaffold  (plan: docs/PHASE0_PLAN.md)
**Batch A — code (free, no accounts) ✅**
- [x] Expo app (SDK 56, TS, expo-router, `src/` layout, CNG/dev-build — never Expo Go)
- [x] `app.config.ts` (name Oshi, scheme `oshi`, bundle `com.oshi.app`) + `eas.json` profiles
- [x] AniList client `src/lib/anilist.ts` (429 backoff; viewer / followingActivity / following / saveProgress / searchMedia) — smoke-tested live
- [x] **cache-not-mirror** schema `supabase/migrations/0001_init.sql` (Oshi-native tables + `anilist_cache` TTL) + RLS deny-by-default on every table
- [x] Edge function `supabase/functions/health` (proves deploy + secret access)
- [x] Widget sources staged (`widgets/ios/OshiWidget.swift`, `widgets/android/oshi-widget.tsx`) + `.env.example`

**Batch B — paid / outward (gated on go-ahead)**
- [ ] EAS build (iOS+Android) + Apple Developer enrollment ($99/yr); install dev build on a device
- [ ] **Widget de-risk spike** — install widget libs, wire plugins, build → placeholder renders on both home screens (exit gate)
- [ ] Supabase project (create + link) → apply `0001_init`; set function secrets
- [ ] Register AniList API client (id/secret + redirect `oshi://auth/callback`); email contact@anilist.co (tracker-clause)

## Web — pre-launch landing (`web/`, Next.js 16) ✅
Built before the apps to validate demand with zero paid accounts. Deploys to Vercel.
- [x] Next 16 + Tailwind v4 + Motion, dark-locked, single rose/penlight accent (taste skill, dials 7/6/3)
- [x] **Premium rebuild** (commit bc1d83a): real **AniList cover showcase** (GSAP horizontal pan), blur-up reveals, glass-pill nav, button-in-button CTAs — applied `3d-web-experience` / `scroll-experience` / `high-end-visual-design`. (HF AI image/3D gen disabled in env → real data.)
- [x] ~~Bonsai hero~~ (tried 3 ways, all removed): Three.js procedural → Blender procedural turntable (d1049af) → real Poly Haven CC0 `potted_plant_01` render (e7c3133). User dropped the concept.
- [x] **Hero → anime cover-art wall** (commit b4a312c): semi-opaque drifting wall of real AniList covers fading left→right into the ink (`web/components/anime-wall.tsx` + `.wall-mask`/marquee in globals.css); headline stays legible; reduced-motion static. Bonsai component/frames/Blender scripts deleted. Verified via headless-Chrome screenshots (desktop + mobile); `next build` green.
- [x] Sections: hero (live phone mock) · syncs-with strip · feature bento · compatibility ring · how-it-works · FAQ · CTA band
- [x] Waitlist API `web/app/api/waitlist` → Supabase `waitlist` table (`0002_waitlist.sql`), graceful no-env fallback
- [x] `next build` green; runtime smoke (200 + API ok); zero em-dashes, eyebrow budget respected
- [ ] Deploy to Vercel (root dir = `web/`; set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` for live waitlist)
- [ ] Point a domain (currently `oshi.app` placeholder in metadata)

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
