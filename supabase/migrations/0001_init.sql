-- 0001_init.sql — Oshi v0 schema (cache-not-mirror)
--
-- ARCHITECTURE NOTE (load-bearing — AniList ToS):
--   "Using the API as backup/data storage is prohibited. Hoarding or mass
--    collection is prohibited."  => We persist ONLY Oshi-native data below.
--   AniList content (media, activity) is NEVER warehoused here. It lives only
--   in `anilist_cache` as a short-TTL serving cache (see bottom), keyed + TTL'd
--   + evicted. Feed items elsewhere reference AniList rows by id (a pointer),
--   not by stored content.
--
-- AUTHZ MODEL:
--   Oshi authenticates via AniList authorization-code OAuth, NOT Supabase Auth.
--   All DB access is mediated by Supabase Edge Functions using the SERVICE ROLE
--   (which bypasses RLS). RLS is ENABLED with NO permissive policies on every
--   table => deny-by-default for the anon/authenticated keys. Direct client DB
--   access is therefore impossible; the edge functions enforce authz in code.

create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ───────────────────────── Oshi-native (persisted) ─────────────────────────

create table users (
  id                uuid primary key default gen_random_uuid(),
  anilist_id        integer unique not null,        -- AniList account id (identity, not content)
  anilist_name      text not null,
  avatar_url        text,
  -- AniList OAuth token, AES-GCM encrypted app-side by the edge fn (TOKEN_ENC_KEY).
  -- Never stored plaintext; never sent to the device. (Chose app-level AES over
  -- pgsodium TCE, which Supabase is deprecating.)
  anilist_token_enc bytea,
  token_expires_at  timestamptz,
  created_at        timestamptz not null default now(),
  last_seen_at      timestamptz not null default now()
);

create table oshi_sessions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  token_hash  text not null unique,                 -- sha256 of the opaque session token held on-device
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  revoked_at  timestamptz
);
create index on oshi_sessions(user_id);

-- Oshi-native follow graph (relationships Oshi creates: invited friends, etc.).
-- Distinct from AniList's follow graph, which we read live + cache, never store.
create table follows (
  follower_id uuid not null references users(id) on delete cascade,
  followee_id uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index on follows(followee_id);

-- Reactions to feed items. A feed item is referenced by its AniList activity id
-- (a pointer, not stored content). Reactions to people not yet on Oshi are stored
-- 'pending' and surfaced via the invite loop (never spam non-users over the API).
create table reactions (
  id                  uuid primary key default gen_random_uuid(),
  actor_id            uuid not null references users(id) on delete cascade,
  anilist_activity_id bigint not null,              -- pointer to AniList activity
  target_anilist_id   integer not null,             -- the user being reacted to
  sticker_id          uuid,                         -- nullable until stickers exist (P3)
  emoji               text,                         -- simple-emoji fallback
  status              text not null default 'sent', -- 'sent' | 'pending'
  created_at          timestamptz not null default now()
);
create index on reactions(target_anilist_id);
create index on reactions(actor_id);

create table sticker_packs (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references users(id) on delete cascade,  -- null = Oshi default pack
  name        text not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table stickers (
  id           uuid primary key default gen_random_uuid(),
  pack_id      uuid not null references sticker_packs(id) on delete cascade,
  -- user-imported UGC (host model / DMCA safe harbor). A storage path, not bytes.
  storage_path text not null,
  created_at   timestamptz not null default now()
);

create table invites (
  id          uuid primary key default gen_random_uuid(),
  inviter_id  uuid not null references users(id) on delete cascade,
  code        text not null unique,
  accepted_by uuid references users(id) on delete set null,
  created_at  timestamptz not null default now(),
  accepted_at timestamptz
);

-- Compatibility scores are Oshi-DERIVED (not AniList content) -> persisted as a
-- cache with provenance, recomputed when inputs change.
create table compat_cache (
  user_a      uuid not null references users(id) on delete cascade,
  user_b      uuid not null references users(id) on delete cascade,
  score       real not null,                        -- 0..1 niche-weighted blend
  why         text,                                 -- human "why you match" line
  computed_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)                           -- canonical unordered pair
);

create table recaps (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  week_start  date not null,
  payload     jsonb not null,                       -- Oshi-computed recap (counts, top title ids)
  created_at  timestamptz not null default now(),
  unique (user_id, week_start)
);

-- ──────────────── Cache (short-TTL serving cache, NOT a mirror) ────────────────
-- The ONLY place AniList responses live, and only transiently. ToS: no hoarding,
-- no use as storage. Rows are keyed, TTL'd, and evicted (see expires_at index).
create table anilist_cache (
  key        text primary key,                      -- e.g. 'feed:user:123:p1', 'media:456'
  payload    jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index on anilist_cache(expires_at);          -- eviction sweeps

-- ───────────────────────── RLS (deny-by-default) ─────────────────────────
-- Enable RLS everywhere; add NO permissive policies. The anon/authenticated keys
-- get nothing; the service-role edge functions (which bypass RLS) are the only
-- path in. (Add scoped policies later only if we move to client-side reads.)
alter table users         enable row level security;
alter table oshi_sessions enable row level security;
alter table follows       enable row level security;
alter table reactions     enable row level security;
alter table sticker_packs enable row level security;
alter table stickers      enable row level security;
alter table invites       enable row level security;
alter table compat_cache  enable row level security;
alter table recaps        enable row level security;
alter table anilist_cache enable row level security;
