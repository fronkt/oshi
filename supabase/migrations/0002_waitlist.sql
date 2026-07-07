-- 0002_waitlist.sql — pre-launch waitlist for the marketing site (web/).
-- Oshi-native data (emails people give us). Shares the project with 0001_init.
-- Writes go through the web route handler using the PUBLISHABLE key: RLS exposes
-- exactly one operation (INSERT) to anon, so the key grants email-signup and
-- nothing else — no reads, no other tables (those stay deny-by-default). This
-- keeps the service-role key out of the marketing site's env entirely.
-- The CHECK mirrors the route's validation so direct REST inserts can't store junk.

create table waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null
             check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' and length(email) <= 254),
  source     text check (source is null or length(source) <= 64),
  created_at timestamptz not null default now()
);

alter table waitlist enable row level security;

-- anon may only INSERT (waitlist signup); no select/update/delete policies exist.
create policy waitlist_anon_insert on waitlist
  for insert to anon
  with check (true);
