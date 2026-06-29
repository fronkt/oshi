# Oshi 推し

A social layer on top of your anime/manga taste. See what your friends are watching and
reading, log your own progress **one-tap from your home screen**, and find the people whose
taste actually matches yours.

> "Airbuds for anime." Effortless social on top of an AniList identity.

**Status:** v0 spec'd — see [`SPEC.md`](./SPEC.md). Pre-scaffold.

## The idea in one screen
- **Logger widget** — media-player-style controls that log progress to AniList one-tap
  (▶ start · ⏭ +1 · ⏮ −1 · ⏸ pause · ✓ complete). This is the wedge: it manufactures the
  activity signal a social anime app otherwise lacks.
- **Social widget + feed** — mirror the *public* activity of everyone you already follow on
  AniList, so the feed is full from minute one (cold-start solved).
- **Compat score** — a niche-weighted taste match between you and each friend, with a
  shareable "why." Upgrades to true *vibe* match when the tone engine lands.
- **Sticker reactions + weekly recap** — the expressive, shareable, invite-driven growth loop.

## Stack
Expo / React Native (TS) · Supabase (Postgres) · AniList GraphQL · (v2: tone-fingerprint engine)

## Guardrails
Metadata + activity only, never content. Legal sources only. AniList tokens encrypted
server-side, never on device. Respect AniList's rate limit. See `SPEC.md` §8.
