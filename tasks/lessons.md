# Lessons

## 2026-06-29 — Don't blanket-apply IP caution; distinguish host vs distributor
**Correction:** I set a guardrail "stickers = original art only, no copyrighted anime images."
User pushed back: users *import their own* stickers (from Pinterest, anywhere), Oshi isn't
selling them.

**Pattern:** For user-generated/user-imported content, the liability model is **host (DMCA safe
harbor)**, not **distributor**. Discord/Telegram operate this way. Blanket "no copyrighted
content" caution is wrong for UGC. The real, narrow requirements are: don't *ship/sell* curated
copyrighted packs yourself, and keep safe-harbor hygiene (DMCA agent + takedown + repeat-infringer
policy). Only content **Oshi itself distributes** (e.g. a default pack) must be original/licensed.

**How to apply:** When flagging IP/legal risk, first ask "is the platform hosting user content or
distributing its own?" Calibrate the caution to that — don't impose distributor-grade rules on a
host-model feature.

## 2026-06-29 — Decouple the moat from the critical path
Mangamood's tone engine was framed as shared between the recommender and the social app. But the
social MVP doesn't need it (Airbuds' own compat score is shallow title-overlap). Pulling the
expensive/unproven engine *off* the critical path of the riskiest bet (retention) let us ship a
cheap read+write v0 and keep the engine as a v2 upgrade. Lesson: when two products "share an
engine," check whether the riskier product actually *needs* it at MVP — often the engine is a
later differentiation layer, not a prerequisite.

## 2026-06-29 — Verify the data-source ToS BEFORE designing the data architecture
I spec'd "mirror everything into Supabase." AniList's ToS explicitly forbids using the API as
storage/backup and bans hoarding/mass collection — the mirror was non-compliant. Caught only because
we verified ToS before building (and before the user's MAL question prompted a deeper look).

**Pattern:** when a product is built on a third-party API, read its ToS *before* committing to a data
architecture — mirroring/caching/redistribution rights are not assumable and are often restricted.
Default to **cache-not-mirror** (short TTL, per-user, serving-only) unless the ToS clearly permits
storage. Also surface, up front: commercial-use thresholds, competing-service clauses, and rate
limits — they shape the architecture, not just the legal page. And sanity-check that the chosen
provider's API can actually deliver the *core mechanic* (AniList has a friend-feed; the bigger MAL does not).

## 2026-06-30 — Reach for the specialized design skills; verify generation tools before promising assets
**Context:** User wanted a premium, non-"vibe-coded" rebuild with a 3D bonsai and Apple-style scroll, and to
install + use the rest of the `leonxlnx/taste-skill` suite.

**Pattern:** For high-end frontend, do not lean only on the general taste-skill. Pull the *specialized* local
skills and apply them concretely: `3d-web-experience` (R3F + drei + postprocessing), `scroll-experience`
(GSAP ScrollTrigger pin/scrub), `high-end-visual-design` (double-bezel cards, button-in-button CTAs,
`cubic-bezier(0.32,0.72,0,1)`, blur-up reveals). They live on disk under `~/.claude/skills` and can be read +
applied even when not registered as invocable Skill-tool skills.

**Hard env constraint (verify before promising assets):** Hugging Face MCP image generation is **disabled**
here (`gradio=none` → `invoke` blocked) and image→3D spaces (TRELLIS/Hunyuan) are **not MCP-enabled** (404 on
`view_parameters`). So no AI render and no AI 3D model in this environment. The right move was a **procedural
Three.js** bonsai (no asset needed) plus **real data** (AniList cover art fetched via the public API) instead
of AI-generated imagery. Always confirm a generation tool actually runs before designing around it.

## 2026-06-30 — Real-time WebGL ≠ photoreal; pre-render frames for "Apple-style" 3D
**Correction:** The procedural Three.js bonsai was rejected — "absolutely terrible, no realism." I'd
conflated "scroll-driven 3D" (the Apple feel) with "real-time WebGL geometry" (which is flat/clay without
heavy texturing the browser can't afford).

**Pattern:** Apple's product-rotation heroes are **not** live WebGL — they're **pre-rendered image
sequences** (offline path-traced frames) scrubbed against scroll progress on a `<canvas>`. When the user
wants photoreal + scroll-animated 3D, the answer is an **offline render → frame sequence → scroll-scrub**,
not R3F. Here that meant a headless **Blender Cycles** turntable (`scripts/bonsai.py`, OPTIX GPU) → 36
WebP+alpha frames → `bonsai-sequence.tsx` (preload, draw frame at `useScroll` progress; reduced-motion =
static frame). Use a **render-and-verify loop**: render headless → Read the PNG → iterate, so you never
tune visuals blind.

**How to apply:** "Apple-style scrolling 3D" → reach for a pre-rendered frame sequence first; only use
live WebGL when interactivity (free orbit, real-time input) is actually required. Match the still the user
approved (settings/density) when batch-rendering the motion frames.

## 2026-06-30 — Procedural ≠ photoreal; when realism is the bar, use a real (CC0) asset
**Correction:** Even the *offline Blender* procedural bonsai was rejected ("still looks very bad"). Hand-built
geometry (leaf cards, swept-curve trunks) doesn't read as real no matter how good the lighting/render is —
photoreal comes from real photogrammetry meshes + scanned PBR textures, which you don't author by hand.

**Pattern:** When the user wants photorealism, stop iterating on procedural geometry and **source a real model**.
Best free path (this env has no AI 3D gen): **Poly Haven** — CC0 (commercial-safe, no attribution required),
direct downloads via a public files API (`api.polyhaven.com/files/<id>`), no login. It has photoscanned potted
plants/trees. Sketchfab/BlenderKit have more (incl. true bonsai) but need a login and are usually CC-BY
(attribution). Preview thumbnails before committing (`cdn.polyhaven.com/asset_img/thumbs/<id>.png`); pick by
*concept fit* (a young potted tree reads "cultivated tree/bonsai"; an arrowhead plant reads "houseplant").

**How to apply:** Drop the downloaded .blend on your existing studio rig (strip its lights/cam, normalize
height, reparent to a turntable root) so brand lighting stays consistent, render the frame sequence, then
**recompress** the photoreal webp (they're ~3× heavier than procedural — 660px/q76 via Pillow got 9.9→3 MB).
For a taste-sensitive visual the user has rejected twice, confirm model + finish with a quick AskUserQuestion
before spending the full render.

## 2026-06-30 — The concept can be the problem, not the execution; and screenshot web visuals
**Context:** After 4 bonsai attempts (2 procedural + 1 real 3D model, all rejected), the user said "remove the
bonsai" and asked for a semi-opaque anime cover-art panel instead. The simple CSS poster wall landed in one shot.

**Pattern:** When a specific asset keeps getting rejected across execution approaches, the issue may be the
**concept**, not the craft — stop polishing it and offer a fundamentally different direction. A wall of the
product's *own real content* (AniList covers) is more on-brand for an anime app than any decorative 3D object,
and far cheaper (a CSS marquee + `mask-image` gradient vs. hours of Blender). Don't over-engineer a hero.

**Verification:** For web UI, *look at it* — drive **headless Chrome** (`chrome --headless=new
--window-size=W,H --screenshot=out.png --virtual-time-budget=9000 <url>`) against the dev server and Read the
PNG, at desktop AND mobile widths. Chrome/Edge are on this machine. This is the web analog of the Blender
render-and-verify loop; never ship a visual change you haven't seen rendered.
