import { describe, it, expect, beforeEach } from "vitest";
import { createRequire } from "node:module";
import { readdirSync, readFileSync } from "node:fs";
import { InMemoryD1Database } from "../src/db/in-memory-db.js";
import { JobRepository } from "../src/db/repositories.js";
import { escapeRfc4180Cell } from "../src/export/csv-rfc4180.js";
import { JOB_EXPORT_JSON_MAX_ROWS } from "../src/export/job-export-limits.js";
import { resetAdminAuthRateLimit } from "../src/index.js";
import worker from "../src/index.js";
import type { ID1Database, ID1PreparedStatement } from "../src/db/types.js";
import type { Job } from "../src/types/domain.js";

const ADMIN = "test-admin-secret-0123456789abcdef";
const PHRASE = "xylophone-protocol";
const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as any;

function catalogJob(id: string, patch: Partial<Job> = {}): Job {
  const seen = 1_700_000_000_000;
  return {
    id,
    companyId: "comp_dl32",
    careerPageId: "page_dl32",
    title: `Role ${id}`,
    seniorityLevel: "mid",
    techCategory: "backend_systems",
    isTechRole: true,
    employmentType: "full-time",
    isRemote: true,
    remoteScope: "worldwide",
    skills: ["TypeScript"],
    applyType: "email",
    applyTarget: "jobs@micro.example",
    status: "open",
    contentHash: `hash_${id}`,
    firstSeenAt: seen,
    lastSeenAt: seen,
    ...patch,
  };
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
          continue;
        }
        quoted = false;
        continue;
      }
      cell += char;
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (char === "\r" && text[i + 1] === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i++;
      continue;
    }
    cell += char;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

describe("CSV escaping and formula injection guard", () => {
  it("prefixes formula triggers and quotes RFC 4180 special characters", () => {
    expect(escapeRfc4180Cell("=1+1")).toBe("'=1+1");
    expect(escapeRfc4180Cell("+1+1")).toBe("'+1+1");
    expect(escapeRfc4180Cell("-1+1")).toBe("'-1+1");
    expect(escapeRfc4180Cell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(escapeRfc4180Cell("\t=cmd")).toBe("'\t=cmd");
    expect(escapeRfc4180Cell("\r=cmd")).toBe("\"'\r=cmd\"");
    expect(escapeRfc4180Cell('Senior, "Platform" Engineer')).toBe('"Senior, ""Platform"" Engineer"');
    expect(escapeRfc4180Cell("Builds\r\nAPIs")).toBe('"Builds\r\nAPIs"');
    expect(escapeRfc4180Cell("plain")).toBe("plain");
  });

  describe("GET /api/jobs/export?format=csv", () => {
    let db: InMemoryD1Database;
    let repo: JobRepository;

    beforeEach(async () => {
      db = new InMemoryD1Database();
      repo = new JobRepository(db);
      resetAdminAuthRateLimit();
      await repo.upsert(catalogJob("job_formula", {
        title: '=HYPERLINK("http://evil.test","click")',
        department: "+1+1",
        location: "-10+20",
        skills: ["@SUM(A1)"],
        descriptionSummary: "\t=cmd",
        rawContent: "\r=cmd",
        firstSeenAt: 1_700_000_000_100,
        lastSeenAt: 1_700_000_000_100,
      }));
      await repo.upsert(catalogJob("job_quoted", {
        title: 'Senior, "Platform" Engineer',
        descriptionSummary: "Builds\r\nAPIs",
        department: "Design, Research",
        firstSeenAt: 1_700_000_000_200,
        lastSeenAt: 1_700_000_000_200,
      }));
    });

    async function exportCsv(headers?: Record<string, string>) {
      return worker.fetch(
        new Request("http://localhost/api/jobs/export?format=csv", headers ? { headers } : undefined),
        { DB: db, ADMIN_TOKEN: ADMIN } as any,
        ctx
      );
    }

    it("streams an attachment whose cells are quoted and neutralized", async () => {
      const res = await exportCsv({ "x-admin-token": ADMIN });
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("text/csv");
      expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="offradar-jobs.csv"');
      expect(res.headers.get("Cache-Control")).toContain("private");
      const body = await res.text();
      expect(body).toContain('"Senior, ""Platform"" Engineer"');
      expect(body).toContain(`"'=HYPERLINK(""http://evil.test"",""click"")"`);

      const table = parseCsv(body);
      const header = table[0]!;
      const byId = new Map(table.slice(1).map((cells) => [cells[header.indexOf("id")], cells]));
      const formula = byId.get("job_formula")!;
      const quoted = byId.get("job_quoted")!;
      const at = (name: string) => header.indexOf(name);

      expect(formula[at("title")]).toBe('\'=HYPERLINK("http://evil.test","click")');
      expect(formula[at("department")]).toBe("'+1+1");
      expect(formula[at("location")]).toBe("'-10+20");
      expect(formula[at("skills")]).toBe("'@SUM(A1)");
      expect(formula[at("descriptionSummary")]).toBe("'\t=cmd");
      expect(formula[at("rawContent")]).toBe("'\r=cmd");
      expect(quoted[at("title")]).toBe('Senior, "Platform" Engineer');
      expect(quoted[at("descriptionSummary")]).toBe("Builds\r\nAPIs");
      expect(quoted[at("department")]).toBe("Design, Research");
    });
  });
});

describe("export auth", () => {
  let db: InMemoryD1Database;

  beforeEach(async () => {
    db = new InMemoryD1Database();
    resetAdminAuthRateLimit();
    await new JobRepository(db).upsert(catalogJob("job_secret", { title: "SECRET_EXPORT_MARKER" }));
  });

  async function call(path: string, init?: RequestInit) {
    return worker.fetch(new Request(`http://localhost${path}`, init), { DB: db, ADMIN_TOKEN: ADMIN } as any, ctx);
  }

  it("rejects an unauthenticated request and a query-string token", async () => {
    const anonymous = await call("/api/jobs/export?format=csv");
    expect(anonymous.status).toBe(401);
    expect(anonymous.headers.get("Content-Type")).toContain("application/json");
    expect(await anonymous.text()).not.toContain("SECRET_EXPORT_MARKER");

    const queryToken = await call(`/api/jobs/export?format=csv&token=${ADMIN}`);
    expect(queryToken.status).toBe(401);
    expect(await queryToken.text()).not.toContain("SECRET_EXPORT_MARKER");

    const invalidFormat = await call("/api/jobs/export?format=xml");
    expect(invalidFormat.status).toBe(401);
  });
});

describe("description search on /api/jobs", () => {
  let db: InMemoryD1Database;

  beforeEach(async () => {
    db = new InMemoryD1Database();
    const repo = new JobRepository(db);
    await repo.upsert(catalogJob("job_summary", {
      title: "Office Coordinator",
      skills: ["Scheduling"],
      department: "Operations",
      location: "Chicago, IL",
      descriptionSummary: `Coordinates the ${PHRASE} rollout`,
    }));
    await repo.upsert(catalogJob("job_raw", {
      title: "Platform Engineer",
      descriptionSummary: "Ships APIs",
      rawContent: `Internal note: ${PHRASE} adapter`,
    }));
    await repo.upsert(catalogJob("job_nontech", {
      title: "Facilities Aide",
      isTechRole: false,
      skills: ["Keys"],
      descriptionSummary: `Mentions ${PHRASE} in the summary`,
    }));
    await repo.upsert(catalogJob("job_other", {
      title: "Baker",
      skills: ["Bread"],
      descriptionSummary: "Bakes bread",
    }));
  });

  async function search(techOnly: boolean) {
    const tech = techOnly ? "" : "&tech_only=false";
    const res = await worker.fetch(
      new Request(`http://localhost/api/jobs?search=${PHRASE}&paged=true&limit=10${tech}`),
      { DB: db } as any,
      ctx
    );
    expect(res.status).toBe(200);
    return await res.json() as { items: { id: string }[]; pagination: { total: number } };
  }

  it("matches descriptionSummary and rawContent and keeps the tech_only total aligned", async () => {
    const tech = await search(true);
    expect(tech.pagination.total).toBe(2);
    expect(tech.items.map((item) => item.id).sort()).toEqual(["job_raw", "job_summary"]);

    const all = await search(false);
    expect(all.pagination.total).toBe(3);
    expect(all.items.map((item) => item.id).sort()).toEqual(["job_nontech", "job_raw", "job_summary"]);
  });
});

describe("JSON export row cap", () => {
  let db: InMemoryD1Database;

  beforeEach(async () => {
    db = new InMemoryD1Database();
    resetAdminAuthRateLimit();
    const repo = new JobRepository(db);
    const total = JOB_EXPORT_JSON_MAX_ROWS + 5;
    for (let i = 0; i < total; i++) {
      await repo.upsert(catalogJob(`job_cap_${i}`, {
        title: `Cap Role ${i}`,
        contentHash: `hash_cap_${i}`,
        firstSeenAt: 1_700_000_000_000 + i,
        lastSeenAt: 1_700_000_000_000 + i,
      }));
    }
  });

  async function page(pageNumber: number) {
    const res = await worker.fetch(
      new Request(`http://localhost/api/jobs/export?format=json&limit=100000&page=${pageNumber}`, {
        headers: { "x-admin-token": ADMIN },
      }),
      { DB: db, ADMIN_TOKEN: ADMIN } as any,
      ctx
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    return await res.json() as {
      items: { id: string }[];
      pagination: { page: number; limit: number; total: number; hasNext: boolean };
    };
  }

  it("refuses to return more than the cap and still paginates the remainder", async () => {
    const first = await page(1);
    const second = await page(2);
    expect(first.pagination.limit).toBe(JOB_EXPORT_JSON_MAX_ROWS);
    expect(first.pagination.total).toBe(JOB_EXPORT_JSON_MAX_ROWS + 5);
    expect(first.items).toHaveLength(JOB_EXPORT_JSON_MAX_ROWS);
    expect(first.pagination.hasNext).toBe(true);
    expect(second.items).toHaveLength(5);
    expect(second.pagination.hasNext).toBe(false);
    const seen = new Set(first.items.map((item) => item.id));
    for (const item of second.items) expect(seen.has(item.id)).toBe(false);
    expect(seen.size + second.items.length).toBe(first.pagination.total);
  });
});

const require = createRequire(import.meta.url);
let sqlite: { DatabaseSync: new (path: string) => { exec(sql: string): void; prepare(sql: string): { get(...params: unknown[]): unknown; all(...params: unknown[]): unknown[]; run(...params: unknown[]): { changes: number } } } } | null = null;
try {
  sqlite = require("node:sqlite");
} catch {
  sqlite = null;
}

function sqliteD1(raw: NonNullable<typeof sqlite> extends never ? never : InstanceType<NonNullable<typeof sqlite>["DatabaseSync"]>): ID1Database {
  const prep = (sql: string): ID1PreparedStatement => {
    let binds: unknown[] = [];
    const statement: ID1PreparedStatement = {
      bind(...values) {
        binds = values;
        return statement;
      },
      async first<T>() {
        return (raw.prepare(sql).get(...binds) ?? null) as T;
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
    prepare: prep,
    async batch(statements) {
      return Promise.all(statements.map(async (statement) => ({ ...(await statement.run()), results: [] })));
    },
    async exec(query) {
      raw.exec(query);
      return { count: 0, duration: 0 };
    },
  };
}

(sqlite ? describe : describe.skip)("description search SQL (count matches rows, including tech_only)", () => {
  let repo: JobRepository;

  beforeEach(async () => {
    const raw = new sqlite!.DatabaseSync(":memory:");
    for (const file of readdirSync("migrations").sort()) raw.exec(readFileSync(`migrations/${file}`, "utf8"));
    raw.exec("DELETE FROM jobs");
    raw.exec(`INSERT INTO companies (id, domain, name, website_url, created_at, updated_at)
      VALUES ('comp_dl32', 'dl32.example', 'DL32 Studio', 'https://dl32.example', 1, 1)`);
    raw.exec(`INSERT INTO career_pages (id, company_id, url, page_type, last_checked_at, created_at)
      VALUES ('page_dl32', 'comp_dl32', 'https://dl32.example/jobs/platform-1', 'custom', 1, 1)`);
    repo = new JobRepository(sqliteD1(raw));
    await repo.upsert(catalogJob("job_summary", {
      title: "Office Coordinator",
      skills: ["Scheduling"],
      descriptionSummary: `Coordinates the ${PHRASE} rollout`,
    }));
    await repo.upsert(catalogJob("job_raw", {
      title: "Platform Engineer",
      descriptionSummary: "Ships APIs",
      rawContent: `Internal note: ${PHRASE} adapter`,
    }));
    await repo.upsert(catalogJob("job_nontech", {
      title: "Facilities Aide",
      isTechRole: false,
      descriptionSummary: `Mentions ${PHRASE} in the summary`,
    }));
    await repo.upsert(catalogJob("job_other", { title: "Baker", descriptionSummary: "Bakes bread" }));
  });

  it("counts the same description matches that it returns, and tech_only narrows both", async () => {
    const tech = await repo.listPaged({ search: PHRASE, techOnly: true, page: 1, limit: 10 });
    const listed = await repo.list({ search: PHRASE, techOnly: true, limit: 10 });
    expect(tech.pagination.total).toBe(2);
    expect(tech.items.map((job) => job.id).sort()).toEqual(["job_raw", "job_summary"]);
    expect(listed.map((job) => job.id).sort()).toEqual(tech.items.map((job) => job.id).sort());

    const first = await repo.listPaged({ search: PHRASE, techOnly: true, page: 1, limit: 1 });
    const second = await repo.listPaged({ search: PHRASE, techOnly: true, page: 2, limit: 1 });
    expect(first.items).toHaveLength(1);
    expect(first.pagination.total).toBe(2);
    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);

    const all = await repo.listPaged({ search: PHRASE, techOnly: false, page: 1, limit: 10 });
    expect(all.pagination.total).toBe(3);
    expect(all.items).toHaveLength(3);
    expect(await repo.count({ techOnly: true })).toBe(3);
    expect(await repo.count()).toBe(4);
  });
});
