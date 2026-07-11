// demo-product.mjs — boot a LOCAL, seeded copy of the web product so the
// animations can be judged in a real browser before the AniList turn-on.
//
//   node scripts/demo-product.mjs     (Ctrl+C to stop; throwaway embedded PG)
//
// Serves a one-click login page on http://localhost:3999 (cookies are
// port-agnostic on localhost, so it can mint sessions for the app on 3005):
//   kaorutest — seeded feed + library (reactions fully live against local DB;
//               /api/log writes are stubbed -> +1 animates then rolls back)
//   matchai   — real AniList user id 2: LIVE public library (258 entries) +
//               profile count-up stats; feed shows the reconnect card
import { spawn } from "node:child_process";
import http from "node:http";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";

const ROOT = path.resolve(import.meta.dirname, "..", "..");
const WEB = path.resolve(import.meta.dirname, "..");
// override when a dead postgres leaves a ghost LISTENING socket behind
const PG_PORT = Number(process.env.DEMO_PG_PORT ?? 5542);
const WEB_PORT = 3005;
const HELPER_PORT = 3999;
const BASE = `http://localhost:${WEB_PORT}`;
const TOKEN_ENC_KEY = crypto.randomBytes(32).toString("base64");

// mirror lib/server/crypto.ts (iv | gcm tag | ciphertext)
function encryptToken(plain) {
  const key = Buffer.from(TOKEN_ENC_KEY, "base64");
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]);
}
const sha256hex = (s) => crypto.createHash("sha256").update(s).digest("hex");

// real AniList cover snapshot from the marketing site (lib/anime.ts is TS —
// the array literal itself is valid JSON, so slice + parse)
const coverSrc = readFileSync(path.join(WEB, "lib", "anime.ts"), "utf8");
const COVERS = JSON.parse(
  coverSrc.slice(coverSrc.indexOf("= [") + 2, coverSrc.lastIndexOf("];") + 1),
);
const byTitle = (t) => {
  const c = COVERS.find((x) => x.title.toLowerCase().includes(t.toLowerCase()));
  if (!c) throw new Error(`no cover for ${t}`);
  return c;
};
const media = (t, { type = "ANIME", format = "TV", episodes = 24, chapters = null } = {}) => {
  const c = byTitle(t);
  return {
    id: c.id,
    type,
    title: { romaji: c.title, english: c.title, native: null },
    format,
    episodes,
    chapters,
    averageScore: c.score,
    popularity: 100000,
    genres: c.genres,
    coverImage: { large: c.cover, color: c.color },
    siteUrl: `https://anilist.co/anime/${c.id}`,
  };
};

/* ── embedded postgres + migrations (same recipe as verify-product.mjs) ── */
const dataDir = mkdtempSync(path.join(tmpdir(), "oshi-demo-pg-"));
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

const boot = new pg.Client({
  host: "127.0.0.1", port: PG_PORT, user: "postgres", password: "postgres", database: "postgres",
});
await boot.connect();
await boot.query(
  `create database oshi encoding 'UTF8' lc_collate 'C' lc_ctype 'C' template template0`,
);
await boot.end();

const su = new pg.Client({
  host: "127.0.0.1", port: PG_PORT, user: "postgres", password: "postgres", database: "oshi",
});
await su.connect();
await su.query(`create role anon nologin; create role authenticated nologin;`);
for (const f of ["0001_init.sql", "0002_waitlist.sql", "0003_web_product.sql"]) {
  await su.query(readFileSync(path.join(ROOT, "supabase", "migrations", f), "utf8"));
  console.log(`  applied ${f}`);
}
await su.query(`alter role oshi_api login password 'localpw';`);

/* ── seed: two browsable users ─────────────────────────────────────────── */
const SA = "demo-A-" + crypto.randomBytes(16).toString("hex");
const SB = "demo-B-" + crypto.randomBytes(16).toString("hex");

const { rows: [userA] } = await su.query(
  `insert into users (anilist_id, anilist_name, avatar_url, anilist_token_enc)
   values (900001, 'kaorutest', null, $1) returning id`,
  [encryptToken("dummy-demo-token")],
);
const { rows: [userB] } = await su.query(
  `insert into users (anilist_id, anilist_name, avatar_url, anilist_token_enc)
   values (2, 'matchai', null, null) returning id`,
);
for (const [u, t] of [[userA.id, SA], [userB.id, SB]]) {
  await su.query(
    `insert into oshi_sessions (user_id, token_hash, expires_at)
     values ($1, $2, now() + interval '12 hours')`,
    [u, sha256hex(t)],
  );
}

const now = Math.floor(Date.now() / 1000);
const h = 3600;
let actId = 777000;
const act = (user, status, progress, mediaObj, agoH) => ({
  id: ++actId,
  status,
  progress,
  createdAt: now - Math.round(agoH * h),
  user,
  media: mediaObj,
});
const friends = {
  riko: { id: 900002, name: "riko", avatar: { large: null } },
  sable: { id: 900003, name: "sable_iris", avatar: { large: null } },
  yuzu: { id: 900004, name: "yuzu_k", avatar: { large: null } },
  ghost: { id: 900005, name: "portable_ghost", avatar: { large: null } },
  holly: { id: 900006, name: "neon_holly", avatar: { large: null } },
  matchai: { id: 2, name: "matchai", avatar: { large: null } }, // real -> profile link is live
};
const feedActivities = [
  act(friends.riko, "watched episode", "5", media("Frieren", { episodes: 28 }), 1),
  act(friends.sable, "completed", null, media("Violet Evergarden", { episodes: 13 }), 2),
  act(friends.yuzu, "watched episode", "2 - 4", media("DAN DA DAN", { episodes: 12 }), 3),
  act(friends.matchai, "plans to watch", null, media("Apothecary", { episodes: 24 }), 5),
  act(friends.ghost, "watched episode", "11", media("Chainsaw Man", { episodes: 12 }), 7),
  act(friends.holly, "completed", null, media("BOCCHI", { episodes: 12 }), 9),
  act(friends.sable, "watched episode", "7", media("SPY x FAMILY", { episodes: 25 }), 12),
  act(friends.riko, "rewatched episode", "8", media("Cowboy Bebop", { episodes: 26 }), 18),
  act(friends.yuzu, "plans to watch", null, media("Cyberpunk", { format: "ONA", episodes: 10 }), 26),
  act(friends.matchai, "watched episode", "3", media("Oshi No Ko", { episodes: 11 }), 30),
];
await su.query(
  `insert into anilist_cache (key, payload, expires_at)
   values ($1, $2, now() + interval '12 hours')`,
  [
    `feed:${userA.id}:p1`,
    JSON.stringify({
      pageInfo: { currentPage: 1, hasNextPage: false },
      activities: feedActivities,
    }),
  ],
);

// pre-seeded reactions so chips show counts on first paint:
// matchai reacted to two activities; one reaction is kaorutest's own (accent chip)
await su.query(
  `insert into reactions (actor_id, anilist_activity_id, target_anilist_id, emoji, status)
   values ($1, $2, 900002, '🔥', 'pending'),
          ($1, $3, 900006, '❤️', 'pending'),
          ($4, $5, 900004, '✨', 'pending')`,
  [userB.id, feedActivities[0].id, feedActivities[5].id, userA.id, feedActivities[2].id],
);

// kaorutest's seeded library (anime; manga tab shows the empty state)
let entryId = 555000;
const entry = (status, t, progress, opts = {}, score = 0) => ({
  id: ++entryId,
  status,
  score,
  progress,
  updatedAt: now - (entryId % 40) * h,
  media: media(t, opts),
});
const lists = [
  {
    name: "Watching",
    status: "CURRENT",
    entries: [
      entry("CURRENT", "Frieren", 5, { episodes: 28 }, 9),
      entry("CURRENT", "DAN DA DAN", 4, { episodes: 12 }, 8),
      entry("CURRENT", "Apothecary", 13, { episodes: 24 }),
      entry("CURRENT", "SPY x FAMILY", 7, { episodes: 25 }, 8),
      entry("CURRENT", "Chainsaw Man", 11, { episodes: 12 }),
      entry("CURRENT", "Mob Psycho", 3, { episodes: 12 }),
    ],
  },
  {
    name: "Rewatching",
    status: "REPEATING",
    entries: [entry("REPEATING", "Cowboy Bebop", 8, { episodes: 26 }, 10)],
  },
  {
    name: "Paused",
    status: "PAUSED",
    entries: [
      entry("PAUSED", "Made in Abyss", 6, { episodes: 13 }, 8),
      entry("PAUSED", "Vinland Saga", 12, { episodes: 24 }),
    ],
  },
  {
    name: "Planning",
    status: "PLANNING",
    entries: [
      entry("PLANNING", "Monster", 0, { episodes: 74 }),
      entry("PLANNING", "Steins;Gate", 0, { episodes: 24 }),
      entry("PLANNING", "Gurren Lagann", 0, { episodes: 27 }),
      entry("PLANNING", "Your Name", 0, { format: "MOVIE", episodes: 1 }),
    ],
  },
  {
    name: "Completed",
    status: "COMPLETED",
    entries: [
      entry("COMPLETED", "Fullmetal", 64, { episodes: 64 }, 10),
      entry("COMPLETED", "Attack on Titan", 25, { episodes: 25 }, 9),
      entry("COMPLETED", "Oshi No Ko", 11, { episodes: 11 }, 9),
      entry("COMPLETED", "A Silent Voice", 1, { format: "MOVIE", episodes: 1 }, 9),
      entry("COMPLETED", "One-Punch Man", 12, { episodes: 12 }, 8),
      entry("COMPLETED", "Death Note", 37, { episodes: 37 }, 8),
      entry("COMPLETED", "Kaguya-sama", 12, { episodes: 12 }, 8),
      entry("COMPLETED", "BOCCHI", 12, { episodes: 12 }, 9),
    ],
  },
  {
    name: "Dropped",
    status: "DROPPED",
    entries: [entry("DROPPED", "Re:ZERO", 4, { episodes: 25 })],
  },
];
await su.query(
  `insert into anilist_cache (key, payload, expires_at)
   values ($1, $2, now() + interval '12 hours'), ($3, $4, now() + interval '12 hours')`,
  [
    `list:900001:ANIME`, JSON.stringify({ lists }),
    `list:900001:MANGA`, JSON.stringify({ lists: [] }),
  ],
);
console.log("seeded: kaorutest (feed+library) / matchai (live AniList)");

/* ── next dev ──────────────────────────────────────────────────────────── */
// hard-killed dev servers (our own teardown) leave a corrupt Turbopack cache
// that makes the next boot accept TCP but never answer — always start fresh
try { rmSync(path.join(WEB, ".next"), { recursive: true, force: true }); } catch {}
console.log("starting next dev…");
const dev = spawn("npx", ["next", "dev", "-p", String(WEB_PORT)], {
  cwd: WEB,
  env: {
    ...process.env,
    DATABASE_URL: `postgres://oshi_api:localpw@127.0.0.1:${PG_PORT}/oshi`,
    TOKEN_ENC_KEY,
    ANILIST_CLIENT_ID: "demo-client",
    ANILIST_CLIENT_SECRET: "demo-secret",
    ANILIST_REDIRECT_URI: `${BASE}/api/auth/callback`,
  },
  shell: true,
  stdio: ["ignore", "ignore", "ignore"],
});

let up = false;
for (let i = 0; i < 60 && !up; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  up = await fetch(BASE, {
    redirect: "manual",
    signal: AbortSignal.timeout(3000),
  }).then((r) => r.status < 500, () => false);
}
if (!up) {
  console.log("dev server never came up (try: rm -rf web/.next)");
  process.exit(1);
}

// prewarm so the first click isn't a cold compile
for (const [p, t] of [["/app", SA], ["/app/library", SA], ["/app/library", SB], ["/app/user/matchai", SB]]) {
  await fetch(`${BASE}${p}`, { headers: { cookie: `oshi_session=${t}` } }).catch(() => {});
}

/* ── one-click login helper ────────────────────────────────────────────── */
const page = `<!doctype html><meta charset="utf-8"><title>Oshi demo</title>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0b10;color:#f4f2f0;font:15px/1.5 system-ui">
<div style="max-width:560px;padding:32px">
  <p style="font-size:28px;font-weight:700;margin:0">推 Oshi — product demo</p>
  <p style="color:#9b96a0">Local seeded build. Pick who to browse as (sets a session cookie, port-local only):</p>
  <a href="/as/kaorutest" style="display:block;margin:14px 0;padding:16px 20px;border:1px solid #2a2a33;border-radius:16px;background:#15151c;color:#f4f2f0;text-decoration:none">
    <b>kaorutest</b> — seeded demo user<br>
    <span style="color:#9b96a0;font-size:13px">Feed cascade + reaction spring pops (fully live, local DB) · library ripple · quick-log pop/roll/+1</span>
  </a>
  <a href="/as/matchai" style="display:block;margin:14px 0;padding:16px 20px;border:1px solid #2a2a33;border-radius:16px;background:#15151c;color:#f4f2f0;text-decoration:none">
    <b>matchai</b> — REAL AniList user (id 2)<br>
    <span style="color:#9b96a0;font-size:13px">Live 258-entry library ripple + profile stat count-ups · feed shows the reconnect card (tokenless)</span>
  </a>
  <p style="color:#9b96a0;font-size:13px">Note: AniList <i>writes</i> are stubbed until the real client is registered (turn-on runbook) — quick-log +1 plays its animation, then the count rolls back when the API says no.</p>
</div>`;

const helper = http.createServer((req, res) => {
  const grant = (token, to) => {
    res.writeHead(302, {
      "set-cookie": `oshi_session=${token}; Path=/; HttpOnly; SameSite=Lax`,
      location: `${BASE}${to}`,
    });
    res.end();
  };
  if (req.url === "/as/kaorutest") return grant(SA, "/app");
  if (req.url === "/as/matchai") return grant(SB, "/app/library");
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(page);
});
helper.listen(HELPER_PORT);

console.log(`\nREADY -> open  http://localhost:${HELPER_PORT}\n(Ctrl+C stops everything and deletes the throwaway DB)`);

/* ── teardown ──────────────────────────────────────────────────────────── */
async function shutdown() {
  console.log("\nshutting down…");
  helper.close();
  try { spawn("taskkill", ["/pid", String(dev.pid), "/T", "/F"], { shell: true }); } catch {}
  try { await su.end(); } catch {}
  try { await epg.stop(); } catch {}
  await new Promise((r) => setTimeout(r, 1500));
  try { rmSync(dataDir, { recursive: true, force: true }); } catch {}
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
