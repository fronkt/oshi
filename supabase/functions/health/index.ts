// Edge function: `health` — proves edge-function deploy + secret access.
// Deno runtime (Supabase). NOT part of the React Native app bundle, so it's
// excluded from the app tsconfig (it uses Deno globals + remote-less std).
//
// Deploy (Batch B): `supabase functions deploy health`
// Secrets (Batch B): `supabase secrets set ANILIST_CLIENT_ID=... TOKEN_ENC_KEY=...`

Deno.serve((_req: Request) => {
  const secrets = {
    serviceRole: Boolean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")),
    anilistClientId: Boolean(Deno.env.get("ANILIST_CLIENT_ID")),
    tokenEncKey: Boolean(Deno.env.get("TOKEN_ENC_KEY")),
  };
  return new Response(
    JSON.stringify({ ok: true, service: "oshi", ts: new Date().toISOString(), secrets }),
    { headers: { "Content-Type": "application/json" } }
  );
});
