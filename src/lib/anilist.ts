/**
 * AniList GraphQL client (ported from moodmanga `scripts/anilist.ts`).
 * Runtime-agnostic: uses global `fetch`, so it works in React Native AND in
 * Supabase Edge Functions (Deno).
 *
 * ToS (load-bearing): AniList forbids using the API as backup/storage and bans
 * hoarding / mass collection. Anything returned here must be treated as a
 * SHORT-TTL serving cache (see `supabase/migrations/0001_init.sql` -> anilist_cache),
 * never warehoused. The public rate limit is degraded to ~30 req/min; this client
 * honors `Retry-After` on 429 and retries.
 *
 * Auth: most reads/writes are per-user with the viewer's OAuth token (held
 * server-side, encrypted; never on the device).
 */

const ENDPOINT = "https://graphql.anilist.co";
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export type MediaType = "ANIME" | "MANGA";
export type MediaListStatus =
  | "CURRENT"
  | "PLANNING"
  | "COMPLETED"
  | "DROPPED"
  | "PAUSED"
  | "REPEATING";

export type AniMedia = {
  id: number;
  type: MediaType;
  title: { romaji: string | null; english: string | null; native: string | null };
  format: string | null;
  episodes: number | null;
  chapters: number | null;
  averageScore: number | null;
  popularity: number | null;
  genres: string[];
  coverImage: { large: string | null; color: string | null };
  siteUrl: string;
};

export type AniUser = { id: number; name: string; avatar: { large: string | null } };

export type ListActivity = {
  id: number;
  status: string; // e.g. "watched episode", "read chapter", "plans to watch"
  progress: string | null;
  createdAt: number;
  user: AniUser;
  media: AniMedia;
};

const MEDIA_FIELDS = `
  id
  type
  title { romaji english native }
  format
  episodes
  chapters
  averageScore
  popularity
  genres
  coverImage { large color }
  siteUrl
`;

type GqlOpts = { token?: string; signal?: AbortSignal };

export async function gql<T>(
  query: string,
  variables: Record<string, unknown> = {},
  opts: GqlOpts = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    signal: opts.signal,
  });

  if (res.status === 429) {
    const retry = Number(res.headers.get("retry-after") ?? "2") * 1000;
    await sleep(retry);
    return gql<T>(query, variables, opts);
  }
  if (!res.ok) throw new Error(`AniList ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { data: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(`AniList: ${json.errors.map((e) => e.message).join("; ")}`);
  }
  return json.data;
}

/** The authenticated viewer — used right after OAuth to bind an Oshi user. */
export async function viewer(token: string): Promise<AniUser> {
  const data = await gql<{ Viewer: AniUser }>(
    `query { Viewer { id name avatar { large } } }`,
    {},
    { token }
  );
  return data.Viewer;
}

/**
 * One page of the viewer's *following* activity — the core "open feed" read.
 * `Page.activities(isFollowing: true)` is the only friend-activity feed any anime
 * API exposes (MAL has none) — which is why Oshi is AniList-first.
 */
export async function followingActivity(
  token: string,
  page = 1,
  perPage = 25
): Promise<{ pageInfo: { currentPage: number; hasNextPage: boolean }; activities: ListActivity[] }> {
  const data = await gql<{
    Page: {
      pageInfo: { currentPage: number; hasNextPage: boolean };
      activities: ListActivity[];
    };
  }>(
    `query ($page: Int, $perPage: Int) {
       Page(page: $page, perPage: $perPage) {
         pageInfo { currentPage hasNextPage }
         activities(isFollowing: true, type: MEDIA_LIST, sort: ID_DESC) {
           ... on ListActivity {
             id status progress createdAt
             user { id name avatar { large } }
             media { ${MEDIA_FIELDS} }
           }
         }
       }
     }`,
    { page, perPage },
    { token }
  );
  return data.Page;
}

/** Who a user follows — for building the Oshi follow graph at import. */
export async function following(
  userId: number,
  page = 1,
  perPage = 50,
  token?: string
): Promise<{ pageInfo: { hasNextPage: boolean }; following: AniUser[] }> {
  const data = await gql<{
    Page: { pageInfo: { hasNextPage: boolean }; following: AniUser[] };
  }>(
    `query ($userId: Int!, $page: Int, $perPage: Int) {
       Page(page: $page, perPage: $perPage) {
         pageInfo { hasNextPage }
         following(userId: $userId, sort: USERNAME) { id name avatar { large } }
       }
     }`,
    { userId, page, perPage },
    { token }
  );
  return data.Page;
}

/**
 * The logger-widget write path: upsert a list entry (status / progress / score).
 * Transport mapping: ▶ CURRENT · ⏭ progress+1 · ⏮ progress-1 · ⏸ PAUSED · ✓ COMPLETED.
 */
export async function saveProgress(
  token: string,
  input: { mediaId: number; status?: MediaListStatus; progress?: number; score?: number }
): Promise<{ id: number; status: string; progress: number; score: number }> {
  const data = await gql<{
    SaveMediaListEntry: { id: number; status: string; progress: number; score: number };
  }>(
    `mutation ($mediaId: Int, $status: MediaListStatus, $progress: Int, $score: Float) {
       SaveMediaListEntry(mediaId: $mediaId, status: $status, progress: $progress, score: $score) {
         id status progress score
       }
     }`,
    input,
    { token }
  );
  return data.SaveMediaListEntry;
}

/** Resolve a title (logger search). */
export async function searchMedia(
  q: string,
  type: MediaType = "ANIME",
  token?: string
): Promise<AniMedia[]> {
  const data = await gql<{ Page: { media: AniMedia[] } }>(
    `query ($q: String, $type: MediaType) {
       Page(perPage: 10) { media(search: $q, type: $type, sort: SEARCH_MATCH) { ${MEDIA_FIELDS} } }
     }`,
    { q, type },
    { token }
  );
  return data.Page.media;
}

/** Best human-readable title (english -> romaji -> native). */
export function displayTitle(m: AniMedia): string {
  return m.title.english ?? m.title.romaji ?? m.title.native ?? `#${m.id}`;
}

/** Strip AniList's HTML descriptions to plain text (kept for later phases). */
export function stripHtml(s: string | null): string {
  if (!s) return "";
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
