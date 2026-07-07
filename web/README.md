# Oshi — pre-launch site

Next.js 16 + Tailwind v4 marketing site. Live at https://oshi-pi.vercel.app (Vercel project `oshi`, CLI-deployed; waitlist → Supabase, see `app/api/waitlist/route.ts`).

```bash
npm run dev    # local dev (http://localhost:3000)
npm run build  # production build — keep this green
```

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
- `lenis` — buttery smooth-scroll, pairs with ScrollTrigger
- `cobe` — the dotted WebGL globe (Stripe/Vercel style)

Notes: `liquid-logo` is paper-design's private Next app, not a library — its effect ships in `@paper-design/shaders-react`. R3F/WebGL components must be client components (`"use client"`) and should be `next/dynamic`-imported with `ssr: false`. Respect `prefers-reduced-motion` (see `anime-wall.tsx` for the house pattern).
