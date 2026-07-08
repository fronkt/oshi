-- 0003_web_product.sql — web product (Next.js on Vercel) data access
--
-- The web backend (Next.js route handlers / server components) talks to Postgres
-- directly through the Supabase connection pooler as a DEDICATED LEAST-PRIVILEGE
-- ROLE, `oshi_api` — not the service role. Rationale: the Supabase MCP never
-- exposes service-role secrets, and a scoped role is a smaller blast radius
-- anyway: it can touch exactly the tables the product needs and nothing else
-- (no storage schema, no auth schema, no waitlist).
--
-- The role's password is set out-of-band (never in the repo); the connection
-- string lives only in Vercel env / .env.local as DATABASE_URL.

alter table users add column if not exists anilist_refresh_enc bytea;

do $$ begin
  create role oshi_api login;
exception when duplicate_object then null;
end $$;

grant usage on schema public to oshi_api;
grant select, insert, update, delete
  on users, oshi_sessions, follows, reactions, anilist_cache
  to oshi_api;

-- RLS stays deny-by-default for anon/authenticated (0001); these permissive
-- policies open the product tables to oshi_api ONLY.
create policy oshi_api_users     on users         for all to oshi_api using (true) with check (true);
create policy oshi_api_sessions  on oshi_sessions for all to oshi_api using (true) with check (true);
create policy oshi_api_follows   on follows       for all to oshi_api using (true) with check (true);
create policy oshi_api_reactions on reactions     for all to oshi_api using (true) with check (true);
create policy oshi_api_cache     on anilist_cache for all to oshi_api using (true) with check (true);
