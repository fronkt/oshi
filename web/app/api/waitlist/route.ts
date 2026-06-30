// Waitlist intake for the pre-launch site.
// Supabase-ready: if SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set, the email
// is inserted into the `waitlist` table (see supabase/migrations/0002_waitlist.sql)
// via the REST endpoint. With no env configured (local/dev), it accepts gracefully
// so the UI is testable without a backend. The service-role key is server-only.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let email = "";
  let source = "web";
  try {
    const body = await req.json();
    email = String(body?.email ?? "");
    if (body?.source) source = String(body.source);
  } catch {
    return Response.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  email = email.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) {
    return Response.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (url && key) {
    const res = await fetch(`${url}/rest/v1/waitlist`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates",
      },
      body: JSON.stringify({ email, source }),
    });
    // 409 = already on the list, which is a success from the user's point of view.
    if (!res.ok && res.status !== 409) {
      return Response.json({ ok: false, error: "store_failed" }, { status: 502 });
    }
  } else {
    console.log(`[waitlist] (no SUPABASE env) would store: ${email} (${source})`);
  }

  return Response.json({ ok: true });
}
