import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { ID1Database, ID1PreparedStatement } from "../../src/db/types.js";

// Real SQLite (node:sqlite) with every migration applied, behind the ID1Database
// interface. Lets tests run the actual SQL instead of the in-memory fake.

const require = createRequire(import.meta.url);

export interface SqliteRaw {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...params: unknown[]): { changes: number | bigint };
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Record<string, unknown>[];
  };
}

export function loadSqlite(): { DatabaseSync: new (path: string) => SqliteRaw } | null {
  try {
    return require("node:sqlite");
  } catch {
    return null;
  }
}

export function migratedSqlite(sqlite: { DatabaseSync: new (path: string) => SqliteRaw }): SqliteRaw {
  const raw = new sqlite.DatabaseSync(":memory:");
  raw.exec("PRAGMA foreign_keys = ON");
  for (const file of readdirSync("migrations").sort()) raw.exec(readFileSync(`migrations/${file}`, "utf8"));
  return raw;
}

export function asD1(raw: SqliteRaw): ID1Database {
  const prepare = (sql: string): ID1PreparedStatement => {
    let binds: unknown[] = [];
    const statement: ID1PreparedStatement = {
      bind(...values) {
        binds = values;
        return statement;
      },
      async first<T>() {
        return (raw.prepare(sql).get(...binds) ?? null) as T | null;
      },
      async all<T>() {
        return { results: raw.prepare(sql).all(...binds) as T[], success: true };
      },
      async run() {
        const result = raw.prepare(sql).run(...binds);
        return { success: true, meta: { changes: Number(result.changes) } };
      },
    };
    return statement;
  };
  return {
    prepare,
    async exec(query) {
      raw.exec(query);
      return { count: 0, duration: 0 };
    },
  };
}
