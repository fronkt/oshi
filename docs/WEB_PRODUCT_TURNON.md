# Turning the web product ON (one-time, ~5 minutes of Frank)

The product code (sign-in, feed, library, profiles, reactions, quick-log) ships
dark: until the env vars below exist in Vercel, the site stays in pure
waitlist mode and nothing user-visible changes. Flipping it on is config only.

## 1. Register the AniList OAuth client (~2 min, Frank's AniList login)

anilist.co → Settings → Developer → "Create New Client":

| Field        | Prod client                                     | Dev client (optional)                        |
|--------------|--------------------------------------------------|----------------------------------------------|
| Name         | `Oshi`                                           | `Oshi (dev)`                                 |
| Redirect URL | `https://oshi-pi.vercel.app/api/auth/callback`   | `http://localhost:3000/api/auth/callback`    |

Copy each client's **ID** and **Secret**. (Redirect must match EXACTLY —
scheme, host, path. When a custom domain lands, register a new client or edit
the redirect.)

## 2. Set the oshi_api DB password (~1 min, needs approval of one SQL command)

The `oshi_api` role exists in prod (migration 0003) but has no password yet.
Claude was denied setting it autonomously (credential provisioning while AFK) —
re-run with Frank present:

```sql
alter role oshi_api password '<GENERATED_PASSWORD>';
```

(via Supabase MCP `execute_sql` or the dashboard SQL editor). Then the
connection string is:

```
postgres://oshi_api.mnjmzqfgjhmidhbahblj:<GENERATED_PASSWORD>@aws-0-us-east-2.pooler.supabase.com:6543/postgres
```

Verify with a one-off `node -e` pg connect before wiring Vercel.

## 3. Add Vercel env (Production) — from bash, NEVER PowerShell (BOM!)

```bash
printf '%s' "<conn string above>"            | npx vercel env add DATABASE_URL production
node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64'))" \
                                             | npx vercel env add TOKEN_ENC_KEY production
printf '%s' "<anilist client id>"            | npx vercel env add ANILIST_CLIENT_ID production
printf '%s' "<anilist client secret>"        | npx vercel env add ANILIST_CLIENT_SECRET production
printf '%s' "https://oshi-pi.vercel.app/api/auth/callback" \
                                             | npx vercel env add ANILIST_REDIRECT_URI production
```

## 4. Deploy + smoke

Fresh `--prod` deploy (never `vercel promote` a preview — preview functions
lack Production env). Then:

1. `/` shows "Sign in with AniList" as the hero CTA
2. Sign in with Frank's AniList → lands on `/app` with a live feed
3. Library +1 on a CURRENT title → check it synced on anilist.co → undo
4. React to someone → row in `reactions` (status `pending` if they're not on Oshi)

## 5. Soon after (not blocking)

- Email `contact@anilist.co` for the tracker-clause exception (SPEC §8)
- `vercel git connect` for push-to-deploy
- Custom domain → new AniList redirect + `ANILIST_REDIRECT_URI` + `metadataBase`
