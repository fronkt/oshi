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
- [x] **Supabase project live** (2026-07-07): `oshi` (ref `mnjmzqfgjhmidhbahblj`, us-east-2, free tier) via MCP; `0001_init` + `0002_waitlist` applied; waitlist E2E-verified against prod DB
- [ ] **GATE: Batch B — remaining paid/outward (EAS build, Apple Dev $99/yr, AniList app reg) awaits go-ahead**

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
- [x] Supabase project (created via MCP, ref `mnjmzqfgjhmidhbahblj`) → `0001_init` + `0002_waitlist` applied. Still open: CLI link + function secrets (with edge-fn deploy)
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
- [x] **Waitlist wired to prod Supabase** (2026-07-07): switched service-role key → **publishable key + anon INSERT-only RLS** (smaller blast radius; MCP never exposes secrets) + DB CHECK mirrors route's email regex. Gotcha: PostgREST `resolution=ignore-duplicates` (ON CONFLICT) needs SELECT under RLS → dropped it, duplicates ride the existing 409-is-success branch. E2E: valid/dup/invalid via route + direct-REST junk/SELECT/DELETE all behave; test rows cleaned
- [x] **LIVE on Vercel** (2026-07-07): https://oshi-pi.vercel.app — project `oshi` (hobby, team `frankyc11223-1729s-projects`), CLI-deployed from `web/`, env `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` (production). Smoke-tested live: homepage 200, waitlist signup/dup/invalid all correct, row verified in DB then cleaned. Note: CLI deploys only — repo not yet git-connected on Vercel (`vercel git connect` later for push-to-deploy)
- [ ] Point a domain (currently `oshi.app` placeholder in metadata; site lives at oshi-pi.vercel.app)
- [x] **Design/effect toolkit installed** (2026-07-07): pmndrs WebGL stack (`three`+R3F 9+drei+postprocessing+maath, `leva` dev), `shadergradient`, `@paper-design/shaders-react` (= liquid-logo's LiquidMetal engine), `liquid-glass-react`+`liquid-glass-js`, `lenis`, `cobe` — all React-19-clean, single deduped `three`, build green; catalog in `web/README.md`. Unused-until-imported (no bundle cost yet)

## Web — immersive rebuild (grilled 2026-07-07, 9 locked decisions)
Locked: hero → full R3F cover-wall v2 (revert path = CSS wall) · shadergradient owns final CTA · interactivity = parallax + scroll choreography + full toy (drag inertial pan w/ rubber-band, hover = physics force-field + brighten, click = focus card w/ title+meta, non-clickable-out) · tiered (desktop full / mobile trimmed DPR≤1.5 no force-field / reduced-motion+no-WebGL = CSS wall) · riders = Lenis smooth scroll + LiquidMetal 推 nav mark · ship = preview deploy → Frank judges laptop+phone → promote. Bar: 60fps desktop drag+scroll, no phone jank, headline always legible, build green.
- [x] SmoothScroll (lenis + ScrollTrigger sync, anchor glide, reduced-motion skip)
- [x] CTA ShaderGradient (ink+rose waterPlane, lazy IO-mount, static fallback) — React-19 compat verified live (only THREE.Clock deprecation warnings)
- [x] LiquidMetal 推 mark in nav (canvas-rasterized dark glyph → shader; flat-mark fallback until fonts ready)
- [x] Hero 3D cover wall (`hero-3d-scene.tsx` + `hero-3d.tsx` wrapper): 60 drei-Image planes, 3 depth layers w/ perspective-spread columns, drift, parallax, force-field, drag inertia + idle glide-home, focus card + DOM caption (Esc/click-away/scroll dismiss), ScrollTrigger dolly/scatter
- [x] Tier wiring verified via playwright-core (`web/scripts/`): mobile = 2 layers + tap-focus + native scroll ✓, reduced-motion = CSS wall no canvas ✓, 60fps 2s sample desktop ✓
- [x] **Gotchas burned in**: (1) same-URL `<img>` no-CORS cache poisons WebGL textures → EVERY cover consumer needs `crossOrigin="anonymous"`; (2) never damp `mesh.scale` to 1 when geometry size lives in scale — bake W/H into targets
- [x] Preview deployed (oshi-d75cj66a8, share link sent) — Frank: "3D wall looks nice" → **stacking premium-lift batch on top, single combined promote after judging**

## Web — premium-lift batch (grilled 2026-07-07, scope (d) w/ (c)/(b) strip-back plan)
Locked: SplitText masked reveals (hero h1 + all section h2s, once, reduced-motion skips) · penlight sparkles @ compat ring + CTA band (sparse rose) · number-flow on compat % (rolls on scroll-into-view) · OG card = owned pixels only (ink + rose gradient + 推 + headline; NO cover art — distributor rule) · cursor = dot + trailing ring, grab-state over wall, native in inputs, fine-pointer only · curtains.js ripple on showcase hover (touch/reduced-motion = current scale) · shine-border on waitlist CTA buttons + spotlight hover on bento cards (vendored, ink/rose). Each piece = one clean strip-commit.
- [x] deps: @number-flow/react, mouse-follower, curtainsjs (SplitText ships in gsap ≥3.13 free)
- [x] SplitText `text-reveal.tsx` → hero h1 + all 6 section h2s (fonts-ready gate, masked lines, once)
- [x] OG image route (fetch-TTF-via-css2-no-UA trick, &text= subsetting; 推 via Noto JP) — verified 200 PNG, card looks premium
- [x] cursor (mouse-follower ring + own glued dot; grab over wall; native over inputs), penlight sparkles (canvas2D not drei — avoids 2 more WebGL contexts), number-flow on compat %, shine-border on waitlist pill, spotlight on all 6 bento cards
- [x] **curtains.js STRIPPED per backup plan** — 31 planes ready but never drew a pixel (real GPU, no errors; eager-img + texture-upload gate + alwaysDraw all no-ops); lesson recorded; future distortion = R3F drei View
- [x] verify: cursor/split/number-flow/OG all live, 60fps, zero console errors, mobile + reduced-motion tiers hold, `next build` green
- [x] stacked preview → Frank judged (one fix: cursor swell removed, ring fixed-size + color-only states) → **PROMOTED to prod 2026-07-07** via fresh `--prod` deploy (NOT `vercel promote` — preview builds lack Production-env Supabase keys → waitlist would silently no-op). Prod smoke: homepage/OG 200, waitlist row verified in DB + cleaned, wall + cursor live, zero page errors. https://oshi-pi.vercel.app is the full immersive site

## Web product pivot (2026-07-07): the real product on the website, app later
User: "create log-in feature and sign in feature along with list viewing and social aspects. grill me for info."
Grill attempted 3× (AskUserQuestion timeouts — Frank AFK) → **recommended answers locked, all overridable**:
1. **Identity = AniList OAuth only** (auth-code grant; server-held AES-GCM token; `oshi_sessions` cookie) — matches SPEC + 0001 schema
2. **Scope = feed + my lists + profiles + emoji reactions (pending for non-users) + quick +1 logging**; compat + search-to-log = fast-follow
3. **Landing CTA: sign-in becomes primary ONLY behind env flag** (`ANILIST_CLIENT_ID` set) — waitlist stays primary until AniList client registered, prod never breaks
4. **Backend = Next.js route handlers on Vercel** (server-only; SPEC's edge fns remain the plan for the mobile app later)
Ship flow: build → verify local → **preview deploy for judging; NO prod promote without Frank**.
DB access: dedicated least-privilege Postgres role `oshi_api` (created via MCP; pooler conn string in env) — Supabase MCP can't mint service-role keys, and this is tighter anyway.
- [x] Migration 0003 APPLIED to prod: `anilist_refresh_enc` column + `oshi_api` role grants/policies. Password NOT set — auto-mode classifier denied autonomous credential provisioning (correctly); one `alter role oshi_api password '…'` awaits Frank (see docs/WEB_PRODUCT_TURNON.md §2)
- [x] web deps `pg`/`server-only` (+`embedded-postgres` dev); server libs `web/lib/server/{db,crypto,session,anilist,cached,reactions}.ts` (AES-256-GCM tokens, sha256 session hashes, ToS cache wrapper)
- [x] Auth routes: login (state nonce) / callback (code→token→viewer→upsert→session cookie) / logout (revoke + clear)
- [x] Product shell `/app`: session-gate layout + client ProductNav (推 mark, Feed/Library pill tabs, `<details>` avatar menu w/ logout)
- [x] `/app` feed (cache TTL 90s, reaction chips w/ counts+mine, pagination, empty/reconnect/AniList-down states)
- [x] `/app/library` (ANIME/MANGA tabs, status sections, custom-list dedupe, QuickLog +1/✓ w/ 6s undo, cache 300s busted by /api/log)
- [x] `/app/user/[name]` (banner/avatar/stats/live activity; on-Oshi badge vs invite-hook line; taste-match-soon chip)
- [x] API: reactions (toggle, pending-for-non-members, emoji allowlist) + log (SaveMediaListEntry, graceful 502, cache bust)
- [x] Landing flag-gated: hero CTA → "Sign in with AniList", nav CTA, FinalCta mobile-waitlist reframe, `/?auth=…` notice banner — **all dark until env set; deployed site unchanged**
- [x] **VERIFIED 23/23**: `web/scripts/verify-product.mjs` = embedded Postgres (UTF-8 db off template0 — WIN1252 gotcha) + real migrations + 2 seeded users + next dev + live AniList (public list/profile for user id 2 `matchai`; id 1 is deleted). Covers auth gate, CSRF, feed render, reaction toggle/pending/sent, RLS-scoped `oshi_api` role, logout revocation, screenshots clean
- [ ] **GATED on Frank (docs/WEB_PRODUCT_TURNON.md):** register AniList client → approve `alter role oshi_api password` → Vercel env (bash printf!) → fresh `--prod` deploy → live OAuth smoke

## Web product — anime.js animation pass (2026-07-11, Frank picked option 1)
anime.js v4 (`animejs@4.5.0`) for the product layer (`/app`); GSAP keeps the landing. House rules: reduced-motion opt-out everywhere, entrance-hold CSS released on mount (+ noscript fallback), below-fold items appear instantly (300+ library entries never all animate).
- [x] `components/product/animate.tsx`: `CardsIn` (stagger/ripple entrance, viewport-only), `StatNumber` (count-up), `springPop` shared tap feedback
- [x] Feed + profile activity cards cascade in; profile stats count up + cascade
- [x] Library ripples from the top-right tab switch (distance-based delay)
- [x] Reaction chips: spring pop on react, palette springs in from the +, pending-note fade
- [x] QuickLog: button pop + count roll + floating "+1" + elastic Completed pop
- [x] `next build` green + verify-product.mjs 23/23 + screenshot judge
- Correction (2026-07-11): Frank meant anime.js on the HOME PAGE. Grill re-attempted (timeout, AFK) -> locked: flourish pass ON TOP of the landing (keep R3F/GSAP core) + KEEP the /app pass. Both overridable.

## Landing — anime.js flourish pass (2026-07-11)
Additive only (Motion Reveals + GSAP choreography untouched); `web/components/fx.tsx`.
- [x] Magnetic spring CTAs (`createAnimatable`): nav pill, hero sign-in (authOn), final-CTA sign-in — desktop fine-pointer only
- [x] Waitlist success celebration: spring-in pill + 14-particle penlight burst (self-cleaning)
- [x] Bento: recap bars spring up staggered on scroll-enter; taste-match 92% ticks up
- [x] How-it-works: connector line draws itself (`svg.createDrawable`) on scroll-enter
- [x] Verified 8/8 (`web/scripts/verify-landing-fx.mjs`: prod build + real Chrome, waitlist API stubbed, particle cleanup + zero page errors asserted) + screenshots
- [x] **Hero resilience (Frank's runtime error 2026-07-11):** per-cover `CoverSafe` boundary (1 bad texture = 1 dropped poster) + `SceneBoundary` -> CSS-wall fallback; root-caused the masking bug (fire-and-forget `spawn(taskkill)` before `process.exit` leaked stale servers serving deleted chunks -> now `spawnSync` everywhere); verified 7/7 (`verify-hero-resilience.mjs`: 1 cover blocked / whole CDN blocked)

- Gotcha hit: stale `.next` Turbopack dev cache wedged `next dev` (accepted TCP, never answered — probe loop hangs since fetch has no timeout). Fix: `rm -rf web/.next`. Also: never edit source files while verify-product.mjs is mid-run.

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
