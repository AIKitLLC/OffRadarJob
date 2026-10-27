import { ID1Database } from "../db/types.js";
import { ApplyClickRepository } from "../db/apply-click-repository.js";
import { Job, User } from "../types/domain.js";
import { validateApplyUrl } from "../services/apply-url-guard.js";
import { isCountableRequest, isDuplicateClick, isValidJobId, parseClickTags } from "../analytics/click-source.js";

// GET /go/:jobId logs an apply click and redirects to the job's stored apply URL (#39).
// GET /api/admin/clicks?days=30 returns click counts for the admin.
// The redirect target comes from the database only, never from the request.

const DAY_MS = 86_400_000;

export interface ApplyClickRouteInput {
  request: Request;
  path: string;
  url: URL;
  db: ID1Database;
  getJob: (id: string) => Promise<Job | null>;
  getUser: () => Promise<User | null>;
  authorizeAdmin: () => Promise<boolean>;
  waitUntil?: ((promise: Promise<unknown>) => void) | undefined;
  now?: (() => number) | undefined;
}

export async function handleApplyClickRoutes(input: ApplyClickRouteInput): Promise<Response | null> {
  const { request, path } = input;
  if (path.startsWith("/go/") && (request.method === "GET" || request.method === "HEAD")) {
    return redirectToApply(input);
  }
  if (path === "/api/admin/clicks" && request.method === "GET") {
    if (!(await input.authorizeAdmin())) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const days = parseDays(input.url.searchParams.get("days"));
    if (days === null) return Response.json({ error: "days must be an integer from 1 to 365" }, { status: 400 });
    const now = input.now?.() ?? Date.now();
    const summary = await new ApplyClickRepository(input.db).summary(now - days * DAY_MS);
    return Response.json({ days, ...summary }, { headers: { "Cache-Control": "private, no-store" } });
  }
  return null;
}

function notFound(): Response {
  return new Response("Not Found", { status: 404, headers: { "Cache-Control": "no-store" } });
}

async function redirectToApply(input: ApplyClickRouteInput): Promise<Response> {
  let jobId: string;
  try {
    jobId = decodeURIComponent(input.path.slice("/go/".length));
  } catch {
    return notFound();
  }
  if (!isValidJobId(jobId)) return notFound();

  const job = await input.getJob(jobId);
  if (!job || job.applyType !== "url") return notFound();
  const target = job.applyTarget.trim();
  if (!validateApplyUrl(target).ok) return notFound();

  const countable = isCountableRequest({
    method: input.request.method,
    userAgent: input.request.headers.get("User-Agent"),
    purpose: input.request.headers.get("Sec-Purpose") ?? input.request.headers.get("Purpose"),
  });
  if (countable) {
    const task = recordClick(input, jobId).catch((error: unknown) => {
      console.error("[apply-click] failed to record click", error instanceof Error ? error.message : String(error));
    });
    if (input.waitUntil) input.waitUntil(task);
    else await task;
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL(target).toString(),
      "Cache-Control": "no-store",
      "Referrer-Policy": "origin",
      "X-Robots-Tag": "noindex",
    },
  });
}

async function recordClick(input: ApplyClickRouteInput, jobId: string): Promise<void> {
  const repo = new ApplyClickRepository(input.db);
  const now = input.now?.() ?? Date.now();
  const user = await input.getUser();
  const userId = user?.id ?? null;
  if (userId !== null && isDuplicateClick(userId, await repo.lastClickAt(userId, jobId), now)) return;
  const tags = parseClickTags(input.url.searchParams.get("src"), input.url.searchParams.get("l"));
  await repo.record({ id: `clk_${crypto.randomUUID()}`, jobId, userId, source: tags.source, listSlug: tags.listSlug, createdAt: now });
}

function parseDays(raw: string | null): number | null {
  if (raw === null || raw === "") return 30;
  const value = Number(raw);
  return Number.isInteger(value) && value >= 1 && value <= 365 ? value : null;
}
