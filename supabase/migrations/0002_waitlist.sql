-- 0002_waitlist.sql — pre-launch waitlist for the marketing site (web/).
-- Oshi-native data (emails people give us). Shares the project with 0001_init.
-- Writes happen only through the web route handler using the service role; RLS is
-- enabled with no permissive policies, so the anon key cannot read or write it.

create table waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  source     text,                        -- which CTA / campaign (e.g. 'web', 'hero')
  created_at timestamptz not null default now()
);

alter table waitlist enable row level security;
