// Pure rules for apply-click measurement (#39). No bindings, no I/O.

export const CLICK_SOURCES = ["dashboard", "list", "digest", "telegram", "mcp", "alert", "other"] as const;
export type ClickSource = (typeof CLICK_SOURCES)[number];

/** Same signed-in user and job inside this window counts once. */
export const CLICK_DEDUPE_WINDOW_MS = 60 * 60 * 1000;

const JOB_ID_RE = /^[A-Za-z0-9_.:-]{1,128}$/;
const LIST_SLUG_RE = /^[a-z0-9-]{1,64}$/;

// Link previews and scripted fetches are redirected but never counted.
const BOT_UA_RE =
  /bot\b|crawler|spider|preview|slackbot|facebookexternalhit|linkedinbot|twitterbot|telegrambot|discordbot|whatsapp|embedly|curl\/|wget\/|python-requests|headless/i;

export interface ClickTags {
  source: ClickSource;
  listSlug: string | null;
}

export function isValidJobId(raw: string): boolean {
  return JOB_ID_RE.test(raw);
}

/** Unknown sources become "other"; a list slug is kept only for list traffic and only when well formed. */
export function parseClickTags(src: string | null, list: string | null): ClickTags {
  const value = (src ?? "").trim().toLowerCase();
  const source: ClickSource = (CLICK_SOURCES as readonly string[]).includes(value) ? (value as ClickSource) : "other";
  const slug = (list ?? "").trim().toLowerCase();
  return { source, listSlug: source === "list" && LIST_SLUG_RE.test(slug) ? slug : null };
}

export interface RequestSignals {
  method: string;
  userAgent: string | null;
  purpose: string | null;
}

/** Only a real GET from a non-bot, non-prefetch client is counted. */
export function isCountableRequest(signals: RequestSignals): boolean {
  if (signals.method !== "GET") return false;
  if (signals.purpose && /prefetch|prerender/i.test(signals.purpose)) return false;
  const ua = signals.userAgent ?? "";
  if (ua.length === 0) return false;
  return !BOT_UA_RE.test(ua);
}

/** Signed-in clicks are deduped per job inside the window. Anonymous clicks are always counted and reported apart. */
export function isDuplicateClick(userId: string | null, lastClickAt: number | null, now: number): boolean {
  if (userId === null || lastClickAt === null) return false;
  return now - lastClickAt < CLICK_DEDUPE_WINDOW_MS;
}
