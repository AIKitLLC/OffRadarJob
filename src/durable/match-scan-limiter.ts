/**
 * Per-user fixed window for POST /api/user/match-alerts/scan.
 * One Durable Object instance per user id (idFromName), so the count is shared
 * across Worker isolates. The in-memory map is only for tests and local runs
 * that have no MATCH_SCAN_LIMITER binding.
 */
import type { SqlLike, LimiterNamespaceLike } from "./admin-auth-limiter.js";

export const MATCH_SCAN_LIMIT = 5;
export const MATCH_SCAN_WINDOW_MS = 10 * 60 * 1000;

export interface MatchScanDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

function decision(allowed: boolean, retryAt: number, now: number): MatchScanDecision {
  return {
    allowed,
    retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((retryAt - now) / 1000)),
  };
}

/** Pure window counter over a SQL store; shared by the Durable Object and tests. */
export class MatchScanLimiterCore {
  constructor(private readonly sql: SqlLike) {
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS scan_windows (k TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL)"
    );
  }

  consume(key: string, now = Date.now()): MatchScanDecision {
    const row = this.sql.exec("SELECT count, reset_at FROM scan_windows WHERE k = ?", key).toArray()[0];
    if (!row || now >= Number(row.reset_at)) {
      const resetAt = now + MATCH_SCAN_WINDOW_MS;
      this.sql.exec(
        "INSERT INTO scan_windows (k, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET count = 1, reset_at = excluded.reset_at",
        key,
        resetAt
      );
      return decision(true, resetAt, now);
    }
    const count = Number(row.count);
    const resetAt = Number(row.reset_at);
    if (count >= MATCH_SCAN_LIMIT) return decision(false, resetAt, now);
    this.sql.exec("UPDATE scan_windows SET count = ? WHERE k = ?", count + 1, key);
    return decision(true, resetAt, now);
  }
}

interface DurableObjectStateLike {
  storage: { sql: SqlLike };
}

/** Durable Object class bound as MATCH_SCAN_LIMITER. */
export class MatchScanLimiter {
  private readonly core: MatchScanLimiterCore;

  constructor(state: DurableObjectStateLike, _env?: unknown) {
    this.core = new MatchScanLimiterCore(state.storage.sql);
  }

  async fetch(request: Request): Promise<Response> {
    const { op, key } = (await request.json().catch(() => ({}))) as { op?: string; key?: string };
    if (typeof key !== "string" || !key) return Response.json({ error: "bad key" }, { status: 400 });
    if (op === "consume") return Response.json(this.core.consume(key));
    return Response.json({ error: "bad op" }, { status: 400 });
  }
}

const memoryWindows = new Map<string, { count: number; resetAt: number }>();

export function resetMatchScanRateLimit(): void {
  memoryWindows.clear();
}

function consumeMemory(userId: string, now = Date.now()): MatchScanDecision {
  const entry = memoryWindows.get(userId);
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + MATCH_SCAN_WINDOW_MS;
    memoryWindows.set(userId, { count: 1, resetAt });
    if (memoryWindows.size > 10_000) {
      for (const [k, v] of memoryWindows) if (now >= v.resetAt) memoryWindows.delete(k);
    }
    return decision(true, resetAt, now);
  }
  if (entry.count >= MATCH_SCAN_LIMIT) return decision(false, entry.resetAt, now);
  entry.count++;
  return decision(true, entry.resetAt, now);
}

const deniedForWindow = (): MatchScanDecision => ({
  allowed: false,
  retryAfterSeconds: Math.ceil(MATCH_SCAN_WINDOW_MS / 1000),
});

/**
 * Consume one scan for this user. Uses the Durable Object when the binding is
 * present and fails closed if that call errors. Without a binding, uses the
 * in-memory window (tests / local).
 */
export async function consumeUserMatchScan(
  env: { MATCH_SCAN_LIMITER?: LimiterNamespaceLike } | undefined,
  userId: string
): Promise<MatchScanDecision> {
  const ns = env?.MATCH_SCAN_LIMITER;
  if (!ns) return consumeMemory(userId);
  try {
    const stub = ns.get(ns.idFromName(userId));
    const res = await stub.fetch("https://match-scan-limiter/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "consume", key: userId }),
    });
    if (!res.ok) return deniedForWindow();
    const body = (await res.json()) as Partial<MatchScanDecision>;
    return {
      allowed: body.allowed === true,
      retryAfterSeconds: body.allowed === true ? 0 : Math.max(1, Number(body.retryAfterSeconds) || deniedForWindow().retryAfterSeconds),
    };
  } catch (err) {
    console.warn("[MatchScanLimiter] unavailable, failing closed:", (err as Error)?.message);
    return deniedForWindow();
  }
}
