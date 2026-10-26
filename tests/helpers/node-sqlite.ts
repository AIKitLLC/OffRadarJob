import { createRequire } from "node:module";
import type { SqlLike } from "../../src/durable/admin-auth-limiter.js";

const require = createRequire(import.meta.url);

interface SqliteStatement {
  all(...params: unknown[]): Record<string, unknown>[];
}

interface SqliteDatabase {
  prepare(sql: string): SqliteStatement;
}

/**
 * In-memory SQLite for Durable Object limiter tests.
 * The built-in is loaded on first use, not at import, and CI starts Node with
 * --experimental-sqlite so the module is available to Vitest workers.
 */
export function sqliteSql(): SqlLike {
  let DatabaseSync: new (path: string) => SqliteDatabase;
  try {
    DatabaseSync = require("node:sqlite").DatabaseSync;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`node:sqlite is unavailable (${message}). Use Node 22 with --experimental-sqlite.`);
  }
  const db = new DatabaseSync(":memory:");
  return {
    exec(query: string, ...bindings: unknown[]) {
      const rows = db.prepare(query).all(...bindings);
      return { toArray: () => rows };
    },
  };
}
