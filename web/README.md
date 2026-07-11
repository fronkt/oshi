# Oshi — site + web product

Next.js 16 + Tailwind v4. Live at https://oshi-pi.vercel.app (Vercel project `oshi`, CLI-deployed; waitlist → Supabase, see `app/api/waitlist/route.ts`).

```bash
npm run dev                       # local dev (http://localhost:3000)
npm run build                     # production build — keep this green
node scripts/verify-product.mjs  # E2E product suite (embedded PG + real migrations)
```

## Web product (`/app`) — v0

The actual product lives under `/app` behind AniList OAuth (authorization-code;
first sign-in is sign-up). It ships **dark**: with no `ANILIST_CLIENT_ID` /
`DATABASE_URL` env the site is pure waitlist mode. Turn-on runbook:
[`docs/WEB_PRODUCT_TURNON.md`](../docs/WEB_PRODUCT_TURNON.md).

- **Auth** `app/api/auth/{login,callback,logout}` — CSRF nonce, AniList tokens
  AES-256-GCM at rest (`lib/server/crypto.ts`), browser holds only an opaque
  `oshi_session` cookie (sha256-hashed in `oshi_sessions`)
- **Pages** `/app` feed (follows' public activity) · `/app/library`
  (anime/manga lists + one-tap +1/complete with undo) · `/app/user/[name]`
  (public profile for ANY AniList user; non-members show the invite hook)
- **APIs** `app/api/reactions` (emoji toggle; `pending` for non-members),
  `app/api/log` (SaveMediaListEntry via the server-held token)
- **Data** `lib/server/db.ts` — pg Pool as the least-privilege `oshi_api` role
  via the Supabase pooler (migration 0003). ToS guardrail: every AniList read
  goes through `lib/server/cached.ts` (short-TTL `anilist_cache`) — never
  warehoused.

## Design / effect toolkit (installed, import on demand)

All tree-shaken: zero bundle cost until a component actually imports them.

**WebGL / 3D (pmndrs stack, single deduped `three`)**
- `three` + `@react-three/fiber` — React renderer for three.js
- `@react-three/drei` — R3F helpers (cameras, text, environments, MeshTransmissionMaterial for real refractive glass)
- `@react-three/postprocessing` — bloom, chromatic aberration, DoF, grain
- `maath` — math/easing helpers for R3F work
- `leva` (dev) — tweak-panel for dialing in shader/scene params

**Shader gradients & liquid metal**
- `shadergradient` — the Framer-famous animated 3D gradients (`<ShaderGradientCanvas>`)
- `@paper-design/shaders-react` — paper.design shader suite: `LiquidMetal` (the engine behind their liquid-logo app), `MeshGradient`, `GodRays`, `NeuroNoise`, etc. GPU-cheap, no three.js needed

**Apple "liquid glass"**
- `liquid-glass-react` — React port of the WWDC-25 glass look (displacement + blur + specular)
- `liquid-glass-js` — zero-dep cross-browser refraction as a JS class / `<liquid-glass>` web component
- (shuding/liquid-glass on GitHub is the same effect but isn't packaged — not installable)

**Motion / scroll / misc**
- `gsap` (+ ScrollTrigger) and `motion` — already in use across the site
- `animejs` (v4) — owns the **product layer** (`/app`): card cascades, spring
  pops, count-ups via `components/product/animate.tsx` (CardsIn / StatNumber /
  springPop). Grid staggers + springs are its home turf; GSAP keeps the landing.
- `lenis` — buttery smooth-scroll, pairs with ScrollTrigger
- `cobe` — the dotted WebGL globe (Stripe/Vercel style)

Notes: `liquid-logo` is paper-design's private Next app, not a library — its effect ships in `@paper-design/shaders-react`. R3F/WebGL components must be client components (`"use client"`) and should be `next/dynamic`-imported with `ssr: false`. Respect `prefers-reduced-motion` (see `anime-wall.tsx` for the house pattern).
