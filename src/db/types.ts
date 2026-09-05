/**
 * Generic abstraction matching Cloudflare D1 interface
 * Allows running both inside Cloudflare Workers and in local Node/Vitest simulations.
 */

export interface ID1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta?: Record<string, unknown>;
}

export interface ID1Response {
  success: boolean;
  meta?: Record<string, unknown>;
}

export interface ID1PreparedStatement {
  bind(...values: unknown[]): ID1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<ID1Result<T>>;
  run(): Promise<ID1Response>;
}

export interface ID1Database {
  prepare(query: string): ID1PreparedStatement;
  batch?(statements: ID1PreparedStatement[]): Promise<ID1Result[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}
