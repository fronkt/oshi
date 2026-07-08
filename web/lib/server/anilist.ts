import "server-only";

/**
 * AniList GraphQL client for the web product — ported from `src/lib/anilist.ts`
 * (the Expo/edge-fn client) and extended with OAuth code exchange + the
 * list/profile queries the web pages need. Kept as a separate copy because
 * `web/` is an isolated package; if the two drift, the root client is the
 * mobile-era source of truth.
 *
 * ToS (load-bearing): no hoarding/mirroring — every read here must go through
 * the short-TTL `anilist_cache` wrapper (`cached.ts`), never a permanent table.
 * Rate limit is degraded to ~30 req/min per token; reads use each viewer's own
 * token so the cap is per-user, and 429s honor Retry-After.
 */

const ENDPOINT = "https://graphql.anilist.co";
const OAUTH_TOKEN = "https://anilist.co/api/v2/oauth/token";
export const OAUTH_AUTHORIZE = "https://anilist.co/api/v2/oauth/authorize";

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

export type ListEntry = {
  id: number;
  status: MediaListStatus;
  score: number;
  progress: number;
  updatedAt: number;
  media: AniMedia;
};

export type AniProfile = AniUser & {
  bannerImage: string | null;
  about: string | null;
  statistics: {
    anime: { count: number; episodesWatched: number; meanScore: number };
    manga: { count: number; chaptersRead: number; meanScore: number };
  };
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
  opts: GqlOpts = {},
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
    cache: "no-store",
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

/* ─────────────────────────────── OAuth ─────────────────────────────── */

export type OAuthTokens = {
  access_token: string;
  refresh_token?: string;
  expires_in: number; // seconds (AniList: ~1 year)
  token_type: string;
};

export function authConfigured(): boolean {
  return Boolean(
    process.env.ANILIST_CLIENT_ID &&
      process.env.ANILIST_CLIENT_SECRET &&
      process.env.ANILIST_REDIRECT_URI &&
      process.env.DATABASE_URL &&
      process.env.TOKEN_ENC_KEY,
  );
}

export function authorizeUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.ANILIST_CLIENT_ID!,
    redirect_uri: process.env.ANILIST_REDIRECT_URI!,
    response_type: "code",
    state,
  });
  return `${OAUTH_AUTHORIZE}?${p}`;
}

export async function exchangeCode(code: string): Promise<OAuthTokens> {
  const res = await fetch(OAUTH_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: process.env.ANILIST_CLIENT_ID,
      client_secret: process.env.ANILIST_CLIENT_SECRET,
      redirect_uri: process.env.ANILIST_REDIRECT_URI,
      code,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`AniList token exchange ${res.status}: ${await res.text()}`);
  return (await res.json()) as OAuthTokens;
}

/* ─────────────────────────────── Queries ─────────────────────────────── */

/** The authenticated viewer — used right after OAuth to bind an Oshi user. */
export async function viewer(token: string): Promise<AniUser> {
  const data = await gql<{ Viewer: AniUser }>(
    `query { Viewer { id name avatar { large } } }`,
    {},
    { token },
  );
  return data.Viewer;
}

/** One page of the viewer's *following* activity — the core "open feed" read. */
export async function followingActivity(
  token: string,
  page = 1,
  perPage = 25,
): Promise<{
  pageInfo: { currentPage: number; hasNextPage: boolean };
  activities: ListActivity[];
}> {
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
    { token },
  );
  // non-ListActivity rows come back as empty objects — drop them
  data.Page.activities = data.Page.activities.filter((a) => a && a.id);
  return data.Page;
}

/** One page of a single user's public activity (profile pages). */
export async function userActivity(
  userId: number,
  page = 1,
  perPage = 15,
  token?: string,
): Promise<{
  pageInfo: { currentPage: number; hasNextPage: boolean };
  activities: ListActivity[];
}> {
  const data = await gql<{
    Page: {
      pageInfo: { currentPage: number; hasNextPage: boolean };
      activities: ListActivity[];
    };
  }>(
    `query ($userId: Int!, $page: Int, $perPage: Int) {
       Page(page: $page, perPage: $perPage) {
         pageInfo { currentPage hasNextPage }
         activities(userId: $userId, type: MEDIA_LIST, sort: ID_DESC) {
           ... on ListActivity {
             id status progress createdAt
             user { id name avatar { large } }
             media { ${MEDIA_FIELDS} }
           }
         }
       }
     }`,
    { userId, page, perPage },
    { token },
  );
  data.Page.activities = data.Page.activities.filter((a) => a && a.id);
  return data.Page;
}

/** Public profile by AniList username. */
export async function userByName(name: string, token?: string): Promise<AniProfile | null> {
  try {
    const data = await gql<{ User: AniProfile | null }>(
      `query ($name: String!) {
         User(name: $name) {
           id name avatar { large }
           bannerImage
           about(asHtml: false)
           statistics {
             anime { count episodesWatched meanScore }
             manga { count chaptersRead meanScore }
           }
         }
       }`,
      { name },
      { token },
    );
    return data.User;
  } catch (e) {
    if (String(e).includes("404") || String(e).includes("Not Found")) return null;
    throw e;
  }
}

/** A user's full anime or manga list, grouped by status by AniList. */
export async function mediaListCollection(
  userId: number,
  type: MediaType,
  token?: string,
): Promise<{ lists: { name: string; status: MediaListStatus | null; entries: ListEntry[] }[] }> {
  const data = await gql<{
    MediaListCollection: {
      lists: { name: string; status: MediaListStatus | null; entries: ListEntry[] }[];
    } | null;
  }>(
    `query ($userId: Int!, $type: MediaType!) {
       MediaListCollection(userId: $userId, type: $type, forceSingleCompletedList: true) {
         lists {
           name
           status
           entries {
             id status score progress updatedAt
             media { ${MEDIA_FIELDS} }
           }
         }
       }
     }`,
    { userId, type },
    { token },
  );
  return data.MediaListCollection ?? { lists: [] };
}

/** The logger write path: upsert a list entry (status / progress / score). */
export async function saveProgress(
  token: string,
  input: { mediaId: number; status?: MediaListStatus; progress?: number; score?: number },
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
    { token },
  );
  return data.SaveMediaListEntry;
}

/** Best human-readable title (english -> romaji -> native). */
export function displayTitle(m: AniMedia): string {
  return m.title.english ?? m.title.romaji ?? m.title.native ?? `#${m.id}`;
}
