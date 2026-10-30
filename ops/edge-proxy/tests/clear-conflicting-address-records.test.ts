import { describe, expect, it, vi } from "vitest";
import { clearConflictingAddressRecords } from "../src/dns/clear-conflicting-address-records.js";

const ACCOUNT_ID = "b".repeat(32);
const ZONE_ID = "c".repeat(32);
const APEX_A = "11111111111111111111111111111111";
const APEX_AAAA = "22222222222222222222222222222222";
const JOBS_A = "33333333333333333333333333333333";
const JOBS_AAAA = "44444444444444444444444444444444";
const DATA_A = "55555555555555555555555555555555";
const DATA_AAAA = "66666666666666666666666666666666";

const PROTECTED = [
  { id: "d".repeat(32), type: "A", name: "ar.ai-kit.net", content: "192.0.2.10" },
  { id: "e".repeat(32), type: "A", name: "crm.ai-kit.net", content: "192.0.2.11" },
  { id: "f".repeat(32), type: "AAAA", name: "blog.ai-kit.net", content: "2001:db8::1" },
  { id: "1".repeat(32), type: "A", name: "pop.ai-kit.net", content: "192.0.2.12" },
  { id: "2".repeat(32), type: "A", name: "crm-dev.ai-kit.net", content: "192.0.2.13" },
  { id: "3".repeat(32), type: "MX", name: "ai-kit.net", content: "mx.example.net" },
  { id: "4".repeat(32), type: "TXT", name: "ai-kit.net", content: "v=spf1 -all" },
  { id: "5".repeat(32), type: "TXT", name: "jobs.ai-kit.net", content: "google-site-verification=abc" },
  { id: "6".repeat(32), type: "CNAME", name: "ai-kit.net", content: "origin.example.net" },
  { id: "7".repeat(32), type: "NS", name: "ai-kit.net", content: "ns.example.net" },
  { id: "8".repeat(32), type: "A", name: "www.ai-kit.net", content: "192.0.2.14" },
];

const CONFLICTING = [
  { id: APEX_A, type: "A", name: "ai-kit.net", content: "192.0.2.1", proxied: true },
  { id: APEX_AAAA, type: "AAAA", name: "ai-kit.net", content: "2001:db8::2", proxied: true },
  { id: JOBS_A, type: "A", name: "jobs.ai-kit.net", content: "192.0.2.3", proxied: true },
  { id: JOBS_AAAA, type: "AAAA", name: "jobs.ai-kit.net", content: "2001:db8::4", proxied: true },
  { id: DATA_A, type: "A", name: "data.ai-kit.net", content: "192.0.2.5", proxied: true },
  { id: DATA_AAAA, type: "AAAA", name: "data.ai-kit.net", content: "2001:db8::5", proxied: true },
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function installApi(records = [...CONFLICTING, ...PROTECTED]): {
  fetchImpl: typeof fetch;
  deleted: string[];
  listUrls: string[];
} {
  const deleted: string[] = [];
  const listUrls: string[] = [];
  const fetchImpl = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    expect(url.origin).toBe("https://api.cloudflare.com");
    expect(init?.redirect).toBe("manual");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer test-token");
    if (url.pathname === "/client/v4/zones") {
      return jsonResponse({
        success: true,
        errors: [],
        result: [{ id: ZONE_ID, name: "ai-kit.net", account: { id: ACCOUNT_ID, name: "hidden" } }],
      });
    }
    const listMatch = url.pathname.match(/^\/client\/v4\/zones\/([^/]+)\/dns_records$/);
    if (listMatch && (init?.method ?? "GET") === "GET") {
      listUrls.push(`${url.pathname}${url.search}`);
      return jsonResponse({
        success: true,
        errors: [],
        result: records,
        result_info: { page: 1, total_pages: 1 },
      });
    }
    const deleteMatch = url.pathname.match(/^\/client\/v4\/zones\/([^/]+)\/dns_records\/([^/]+)$/);
    if (deleteMatch && init?.method === "DELETE") {
      deleted.push(deleteMatch[2] ?? "");
      return jsonResponse({
        success: true,
        errors: [],
        result: { id: deleteMatch[2], type: "A", name: "ai-kit.net", content: "192.0.2.1" },
      });
    }
    throw new Error(`unexpected ${init?.method ?? "GET"} ${url.pathname}`);
  });
  return { fetchImpl, deleted, listUrls };
}

describe("clear conflicting address records", () => {
  it("deletes only proxied-host A/AAAA records and logs type, name, and id", async () => {
    const api = installApi();
    const lines: string[] = [];
    await clearConflictingAddressRecords({
      token: "test-token",
      accountId: ACCOUNT_ID,
      fetchImpl: api.fetchImpl,
      log: (line) => lines.push(line),
    });

    expect(api.deleted).toEqual([APEX_A, JOBS_A, DATA_A, APEX_AAAA, JOBS_AAAA, DATA_AAAA]);
    expect(lines).toEqual([
      `A ai-kit.net ${APEX_A}`,
      `A jobs.ai-kit.net ${JOBS_A}`,
      `A data.ai-kit.net ${DATA_A}`,
      `AAAA ai-kit.net ${APEX_AAAA}`,
      `AAAA jobs.ai-kit.net ${JOBS_AAAA}`,
      `AAAA data.ai-kit.net ${DATA_AAAA}`,
    ]);
    expect(lines.join("\n")).not.toContain("192.0.2");
    expect(lines.join("\n")).not.toContain("test-token");
    expect(lines.join("\n")).not.toContain("mx.example");
    for (const url of api.listUrls) {
      const parsed = new URL(url, "https://api.cloudflare.com");
      expect(["A", "AAAA"]).toContain(parsed.searchParams.get("type"));
      expect(["ai-kit.net", "jobs.ai-kit.net", "data.ai-kit.net"]).toContain(parsed.searchParams.get("name"));
    }
    expect(api.listUrls).toHaveLength(6);
  });

  it("does not delete when the zone lookup is ambiguous", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        success: true,
        errors: [],
        result: [
          { id: ZONE_ID, name: "ai-kit.net", account: { id: ACCOUNT_ID } },
          { id: "a".repeat(32), name: "ai-kit.net", account: { id: ACCOUNT_ID } },
        ],
      }),
    );
    await expect(
      clearConflictingAddressRecords({
        token: "test-token",
        accountId: ACCOUNT_ID,
        fetchImpl,
        log: () => {
          throw new Error("should not log");
        },
      }),
    ).rejects.toThrow(/exactly one zone/);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("does not delete when the account id does not match the zone", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        success: true,
        errors: [],
        result: [{ id: ZONE_ID, name: "ai-kit.net", account: { id: "a".repeat(32) } }],
      }),
    );
    await expect(
      clearConflictingAddressRecords({
        token: "test-token",
        accountId: ACCOUNT_ID,
        fetchImpl,
      }),
    ).rejects.toThrow(/account did not match/);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("does not delete protected records when no address records conflict", async () => {
    const api = installApi(PROTECTED);
    const lines: string[] = [];
    await clearConflictingAddressRecords({
      token: "test-token",
      accountId: ACCOUNT_ID,
      fetchImpl: api.fetchImpl,
      log: (line) => lines.push(line),
    });
    expect(api.deleted).toEqual([]);
    expect(lines).toEqual([]);
  });

  it("refuses redirects before deleting anything", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(null, { status: 302, headers: { location: "https://evil.example" } }));
    await expect(
      clearConflictingAddressRecords({
        token: "test-token",
        accountId: ACCOUNT_ID,
        fetchImpl,
      }),
    ).rejects.toThrow(/redirect refused/);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});
