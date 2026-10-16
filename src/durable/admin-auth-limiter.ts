/**
 * Durable, SQLite-backed counter of failed admin auth attempts.
 * One Durable Object instance per key (idFromName(key)), so counts are global and survive isolate restarts.
 */

export const ADMIN_AUTH_MAX_FAILURES = 10;
export const ADMIN_AUTH_WINDOW_MS = 15 * 60 * 1000;

/** Minimal subset of the Durable Object SQL API (`ctx.storage.sql`). */
export interface SqlLike {
  exec(query: string, ...bindings: unknown[]): { toArray(): Record<string, unknown>[] };
}

/** Pure limiter logic over a SQL store; shared by the Durable Object and tests. */
export class AdminAuthLimiterCore {
  constructor(private readonly sql: SqlLike) {
    this.sql.exec("CREATE TABLE IF NOT EXISTS auth_failures (k TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL)");
  }

  isLimited(key: string, now = Date.now()): boolean {
    const row = this.sql.exec("SELECT count, reset_at FROM auth_failures WHERE k = ?", key).toArray()[0];
    if (!row) return false;
    if (now >= Number(row.reset_at)) {
      this.sql.exec("DELETE FROM auth_failures WHERE k = ?", key);
      return false;
    }
    return Number(row.count) >= ADMIN_AUTH_MAX_FAILURES;
  }

  /** Records one failure; returns whether the key is now limited. */
  recordFailure(key: string, now = Date.now()): boolean {
    const row = this.sql.exec("SELECT count, reset_at FROM auth_failures WHERE k = ?", key).toArray()[0];
    let count = 1;
    if (!row || now >= Number(row.reset_at)) {
      this.sql.exec(
        "INSERT INTO auth_failures (k, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET count = 1, reset_at = excluded.reset_at",
        key,
        now + ADMIN_AUTH_WINDOW_MS
      );
    } else {
      count = Number(row.count) + 1;
      this.sql.exec("UPDATE auth_failures SET count = ? WHERE k = ?", count, key);
    }
    return count >= ADMIN_AUTH_MAX_FAILURES;
  }
}

interface DurableObjectStateLike {
  storage: { sql: SqlLike };
}

/** The Durable Object class bound as ADMIN_AUTH_LIMITER (declared in wrangler.jsonc, new_sqlite_classes). */
export class AdminAuthLimiter {
  private readonly core: AdminAuthLimiterCore;

  constructor(state: DurableObjectStateLike, _env?: unknown) {
    this.core = new AdminAuthLimiterCore(state.storage.sql);
  }

  async fetch(request: Request): Promise<Response> {
    const { op, key } = (await request.json().catch(() => ({}))) as { op?: string; key?: string };
    if (typeof key !== "string" || !key) return Response.json({ error: "bad key" }, { status: 400 });
    if (op === "check") return Response.json({ limited: this.core.isLimited(key) });
    if (op === "fail") return Response.json({ limited: this.core.recordFailure(key) });
    return Response.json({ error: "bad op" }, { status: 400 });
  }
}

/** Minimal Durable Object namespace surface used by the worker. */
export interface LimiterNamespaceLike {
  idFromName(name: string): unknown;
  get(id: any): { fetch(input: string, init?: RequestInit): Promise<Response> };
}
