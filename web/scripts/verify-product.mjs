// verify-product.mjs — end-to-end check of the web product (auth, feed, library,
// profile, reactions, logging) against a THROWAWAY embedded Postgres running the
// real migrations (0001+0002+0003), so no prod credentials are involved.
//
//   node scripts/verify-product.mjs
//
// Seeds two users:
//   A "kaorutest"  — valid-format (but fake) AniList token + a seeded feed cache
//                    row -> exercises feed rendering, reactions, graceful /api/log
//   B "matchai"    — real public AniList id 2, NO token -> exercises the
//                    reconnect card, live public library + profile fetches
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import { chromium } from "playwright-core";

const SCRATCH =
  "C:/Users/frank/AppData/Local/Temp/claude/C--Users-frank/05eee529-de72-46d8-8db6-b805590f3d20/scratchpad";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = path.resolve(import.meta.dirname, "..", "..");
const WEB = path.resolve(import.meta.dirname, "..");

const PG_PORT = 5541;
const WEB_PORT = 3005;
const BASE = `http://localhost:${WEB_PORT}`;
const TOKEN_ENC_KEY = crypto.randomBytes(32).toString("base64");

let pass = 0,
  fail = 0,
  warn = 0;
const ok = (name, cond, detail = "") => {
  if (cond) {
    pass++;
    console.log(`  PASS ${name}`);
  } else {
    fail++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
};
const soft = (name, cond, detail = "") => {
  if (cond) {
    pass++;
    console.log(`  PASS ${name}`);
  } else {
    warn++;
    console.log(`  WARN ${name} (live AniList dependent)${detail ? ` — ${detail}` : ""}`);
  }
};

// mirror lib/server/crypto.ts (iv | gcm tag | ciphertext)
function encryptToken(plain) {
  const key = Buffer.from(TOKEN_ENC_KEY, "base64");
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]);
}
const sha256hex = (s) => crypto.createHash("sha256").update(s).digest("hex");

/* ── 1. embedded postgres + migrations ─────────────────────────────────── */
const dataDir = mkdtempSync(path.join(tmpdir(), "oshi-pg-"));
const epg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port: PG_PORT,
  persistent: false,
});
console.log("starting embedded postgres…");
await epg.initialise();
await epg.start();

// the windows cluster defaults to WIN1252; the migrations are UTF-8 -> make a
// UTF-8 database off template0 and do everything in there
const boot = new pg.Client({
  host: "127.0.0.1",
  port: PG_PORT,
  user: "postgres",
  password: "postgres",
  database: "postgres",
});
await boot.connect();
await boot.query(
  `create database oshi encoding 'UTF8' lc_collate 'C' lc_ctype 'C' template template0`,
);
await boot.end();

const su = new pg.Client({
  host: "127.0.0.1",
  port: PG_PORT,
  user: "postgres",
  password: "postgres",
  database: "oshi",
});
await su.connect();

await su.query(`create role anon nologin; create role authenticated nologin;`);
for (const f of ["0001_init.sql", "0002_waitlist.sql", "0003_web_product.sql"]) {
  const sql = readFileSync(path.join(ROOT, "supabase", "migrations", f), "utf8");
  try {
    await su.query(sql);
    console.log(`  applied ${f}`);
  } catch (e) {
    console.log(`  FAILED applying ${f}: ${e.message}`);
    process.exit(1);
  }
}
await su.query(`alter role oshi_api login password 'localpw';`);

/* ── 2. seed ───────────────────────────────────────────────────────────── */
const A_TOKEN = "sess-A-" + crypto.randomBytes(16).toString("hex");
const B_TOKEN = "sess-B-" + crypto.randomBytes(16).toString("hex");

const { rows: [userA] } = await su.query(
  `insert into users (anilist_id, anilist_name, avatar_url, anilist_token_enc)
   values (900001, 'kaorutest', null, $1) returning id`,
  [encryptToken("dummy-anilist-token")],
);
const { rows: [userB] } = await su.query(
  `insert into users (anilist_id, anilist_name, avatar_url, anilist_token_enc)
   values (2, 'matchai', null, null) returning id`,
);
for (const [u, t] of [
  [userA.id, A_TOKEN],
  [userB.id, B_TOKEN],
]) {
  await su.query(
    `insert into oshi_sessions (user_id, token_hash, expires_at)
     values ($1, $2, now() + interval '1 day')`,
    [u, sha256hex(t)],
  );
}

// seeded feed cache for A (shape must match followingActivity())
const media = {
  id: 101922,
  type: "ANIME",
  title: { romaji: "Kimetsu no Yaiba", english: "Demon Slayer", native: "鬼滅の刃" },
  format: "TV",
  episodes: 26,
  chapters: null,
  averageScore: 83,
  popularity: 100,
  genres: ["Action"],
  coverImage: {
    large: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx101922-PEn1CTc93blC.jpg",
    color: "#e4a15d",
  },
  siteUrl: "https://anilist.co/anime/101922",
};
const feedPayload = {
  pageInfo: { currentPage: 1, hasNextPage: false },
  activities: [
    {
      id: 777001,
      status: "watched episode",
      progress: "5",
      createdAt: Math.floor(Date.now() / 1000) - 3600,
      user: { id: 900002, name: "riko_offline", avatar: { large: null } },
      media,
    },
    {
      id: 777002,
      status: "completed",
      progress: null,
      createdAt: Math.floor(Date.now() / 1000) - 7200,
      user: { id: 2, name: "matchai", avatar: { large: null } },
      media,
    },
  ],
};
await su.query(
  `insert into anilist_cache (key, payload, expires_at)
   values ($1, $2, now() + interval '10 minutes')`,
  [`feed:${userA.id}:p1`, JSON.stringify(feedPayload)],
);

/* ── 3. next dev server ────────────────────────────────────────────────── */
console.log("starting next dev…");
const env = {
  ...process.env,
  DATABASE_URL: `postgres://oshi_api:localpw@127.0.0.1:${PG_PORT}/oshi`,
  TOKEN_ENC_KEY,
  ANILIST_CLIENT_ID: "test-client",
  ANILIST_CLIENT_SECRET: "test-secret",
  ANILIST_REDIRECT_URI: `${BASE}/api/auth/callback`,
};
const dev = spawn("npx", ["next", "dev", "-p", String(WEB_PORT)], {
  cwd: WEB,
  env,
  shell: true,
  stdio: ["ignore", "pipe", "pipe"],
});
dev.stdout.on("data", () => {});
dev.stderr.on("data", () => {});

let up = false;
for (let i = 0; i < 60 && !up; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  // per-request timeout: a wedged dev server (stale .next cache) accepts TCP
  // but never answers — without this the probe hangs forever instead of failing
  up = await fetch(BASE, {
    redirect: "manual",
    signal: AbortSignal.timeout(3000),
  }).then((r) => r.status < 500, () => false);
}
if (!up) {
  console.log("dev server never came up");
  process.exit(1);
}

const get = (p, cookie) =>
  fetch(`${BASE}${p}`, {
    redirect: "manual",
    headers: cookie ? { cookie } : {},
  });
const cookieA = `oshi_session=${A_TOKEN}`;
const cookieB = `oshi_session=${B_TOKEN}`;

try {
  /* ── 4. logged-out + auth flow ───────────────────────────────────────── */
  console.log("\n[auth + gate]");
  const landing = await (await get("/")).text();
  ok("landing serves sign-in CTA when auth env set", landing.includes("Sign in with AniList"));
  ok("landing waitlist demoted to mobile pitch", landing.includes("mobile app"));

  const gate = await get("/app");
  ok(
    "/app redirects logged-out visitors",
    [303, 307, 308].includes(gate.status) &&
      (gate.headers.get("location") ?? "").includes("auth=required"),
    `status ${gate.status} -> ${gate.headers.get("location")}`,
  );

  const login = await get("/api/auth/login");
  const loc = login.headers.get("location") ?? "";
  ok(
    "/api/auth/login redirects to AniList authorize with state",
    login.status >= 300 &&
      loc.startsWith("https://anilist.co/api/v2/oauth/authorize") &&
      loc.includes("client_id=test-client") &&
      loc.includes("state="),
    loc.slice(0, 120),
  );
  ok(
    "login sets the CSRF nonce cookie",
    (login.headers.get("set-cookie") ?? "").includes("oshi_oauth_state="),
  );

  const csrf = await get("/api/auth/callback?code=evil");
  ok(
    "callback without nonce cookie is rejected",
    (csrf.headers.get("location") ?? "").includes("auth=failed"),
    csrf.headers.get("location"),
  );

  /* ── 5. user A: feed render + reactions + graceful log ──────────────── */
  console.log("\n[user A: feed + reactions]");
  const feedRes = await get("/app", cookieA);
  const feedHtml = await feedRes.text();
  ok("feed 200 for user A", feedRes.status === 200, `status ${feedRes.status}`);
  ok("feed renders seeded activity (title)", feedHtml.includes("Demon Slayer"));
  ok("feed renders actor + action", feedHtml.includes("riko_offline") && feedHtml.includes("watched episode 5 of"));

  const react = (body) =>
    fetch(`${BASE}/api/reactions`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieA },
      body: JSON.stringify(body),
    }).then(async (r) => ({ status: r.status, data: await r.json().catch(() => ({})) }));

  const r1 = await react({ activityId: 777001, targetAnilistId: 900002, emoji: "🔥" });
  ok("react to non-member -> pending", r1.data.state === "pending", JSON.stringify(r1));
  const r2 = await react({ activityId: 777002, targetAnilistId: 2, emoji: "❤️" });
  ok("react to member -> sent", r2.data.state === "sent", JSON.stringify(r2));
  const r3 = await react({ activityId: 777001, targetAnilistId: 900002, emoji: "🔥" });
  ok("same reaction again toggles off", r3.data.state === "removed", JSON.stringify(r3));
  const r4 = await react({ activityId: 777001, targetAnilistId: 900002, emoji: "🍕" });
  ok("unknown emoji rejected", r4.status === 400, JSON.stringify(r4));
  const rows = await su.query(`select emoji, status from reactions order by created_at`);
  ok(
    "reactions table holds exactly the surviving row",
    rows.rowCount === 1 && rows.rows[0].emoji === "❤️" && rows.rows[0].status === "sent",
    JSON.stringify(rows.rows),
  );
  const noAuth = await fetch(`${BASE}/api/reactions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ activityId: 1, targetAnilistId: 1, emoji: "🔥" }),
  });
  ok("reactions require a session", noAuth.status === 401);

  const logRes = await fetch(`${BASE}/api/log`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: cookieA },
    body: JSON.stringify({ mediaId: 101922, progress: 6 }),
  });
  ok(
    "/api/log with a bad AniList token fails gracefully (502 json)",
    logRes.status === 502 && (await logRes.json()).error === "anilist_failed",
    `status ${logRes.status}`,
  );

  /* ── 6. user B: reconnect card + live public data ────────────────────── */
  console.log("\n[user B: tokenless + live public AniList]");
  const feedB = await (await get("/app", cookieB)).text();
  ok("tokenless user sees the reconnect card", feedB.includes("Reconnect AniList"));

  const libB = await get("/app/library", cookieB);
  const libHtml = await libB.text();
  soft(
    "library renders live public list for AniList user 2",
    libB.status === 200 && !libHtml.includes("Could not load") &&
      (libHtml.includes("Watching") || libHtml.includes("Completed") || libHtml.includes("Planning")),
  );

  const prof = await get("/app/user/matchai", cookieB);
  const profHtml = await prof.text();
  soft(
    "public profile page renders live (Josh, on Oshi badge)",
    prof.status === 200 && profHtml.includes("matchai") && profHtml.includes("on Oshi"),
  );

  /* ── 7. logout ───────────────────────────────────────────────────────── */
  console.log("\n[logout]");
  const out = await fetch(`${BASE}/api/auth/logout`, {
    method: "POST",
    redirect: "manual",
    headers: { cookie: cookieA },
  });
  const cleared = (out.headers.get("set-cookie") ?? "").match(/oshi_session=;|oshi_session=.*Max-Age=0/i);
  ok("logout clears the session cookie", out.status === 303 && Boolean(cleared));
  const revoked = await su.query(
    `select revoked_at from oshi_sessions where token_hash = $1`,
    [sha256hex(A_TOKEN)],
  );
  ok("logout revokes the session row", revoked.rows[0]?.revoked_at != null);
  const afterOut = await get("/app", cookieA);
  ok(
    "revoked session no longer opens /app",
    (afterOut.headers.get("location") ?? "").includes("auth=required"),
  );

  /* ── 8. screenshots ──────────────────────────────────────────────────── */
  console.log("\n[screenshots]");
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addCookies([
    { name: "oshi_session", value: A_TOKEN, url: BASE },
  ]);
  // A's session was revoked by the logout test — mint a fresh one
  const A2 = "sess-A2-" + crypto.randomBytes(12).toString("hex");
  await su.query(
    `insert into oshi_sessions (user_id, token_hash, expires_at)
     values ($1, $2, now() + interval '1 day')`,
    [userA.id, sha256hex(A2)],
  );
  await ctx.clearCookies();
  await ctx.addCookies([{ name: "oshi_session", value: A2, url: BASE }]);
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 200)));
  // 1.4s settle: the anime.js entrance cascade must be done, not mid-fade
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${SCRATCH}/prod-feed.png` });
  await ctx.clearCookies();
  await ctx.addCookies([{ name: "oshi_session", value: B_TOKEN, url: BASE }]);
  await page.goto(`${BASE}/app/library`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${SCRATCH}/prod-library.png`, fullPage: true });
  await page.goto(`${BASE}/app/user/matchai`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${SCRATCH}/prod-profile.png`, fullPage: true });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${SCRATCH}/prod-landing-authmode.png` });
  ok("no page errors during screenshots", pageErrors.length === 0, pageErrors.join(" | "));
  await browser.close();
} finally {
  /* ── teardown ────────────────────────────────────────────────────────── */
  dev.kill("SIGTERM");
  try {
    // kill the whole tree on windows (npx spawns a child)
    spawn("taskkill", ["/pid", String(dev.pid), "/T", "/F"], { shell: true });
  } catch {}
  await su.end();
  try {
    await epg.stop();
  } catch {}
  // postgres file handles can linger a beat on windows
  await new Promise((r) => setTimeout(r, 1500));
  try {
    rmSync(dataDir, { recursive: true, force: true });
  } catch {}
}

console.log(`\n=== ${pass} passed, ${fail} failed, ${warn} live-warn ===`);
process.exit(fail ? 1 : 0);
