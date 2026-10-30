import { describe, expect, it } from "vitest";
import {
  CONFLICTING_ADDRESS_NAMES,
  CONFLICTING_ADDRESS_TYPES,
  conflictingAddressQueries,
  isConflictingAddressRecord,
} from "../src/dns/conflicting-address-record.js";

describe("conflicting address record allowlist", () => {
  it("queries only A and AAAA on the proxied public hosts", () => {
    expect(conflictingAddressQueries()).toEqual([
      { type: "A", name: "ai-kit.net" },
      { type: "A", name: "jobs.ai-kit.net" },
      { type: "A", name: "data.ai-kit.net" },
      { type: "AAAA", name: "ai-kit.net" },
      { type: "AAAA", name: "jobs.ai-kit.net" },
      { type: "AAAA", name: "data.ai-kit.net" },
    ]);
    expect(CONFLICTING_ADDRESS_TYPES).toEqual(["A", "AAAA"]);
    expect(CONFLICTING_ADDRESS_NAMES).toEqual(["ai-kit.net", "jobs.ai-kit.net", "data.ai-kit.net"]);
  });

  it("selects only the exact proxied-host A/AAAA names", () => {
    expect(isConflictingAddressRecord({ type: "A", name: "ai-kit.net" })).toBe(true);
    expect(isConflictingAddressRecord({ type: "AAAA", name: "jobs.ai-kit.net" })).toBe(true);
    expect(isConflictingAddressRecord({ type: "A", name: "data.ai-kit.net" })).toBe(true);
    expect(isConflictingAddressRecord({ type: "AAAA", name: "Data.AI-KIT.net." })).toBe(true);
    expect(isConflictingAddressRecord({ type: "a", name: "AI-KIT.NET." })).toBe(true);
  });

  it.each([
    ["A", "ar.ai-kit.net"],
    ["A", "crm.ai-kit.net"],
    ["A", "pop.ai-kit.net"],
    ["AAAA", "crm-dev.ai-kit.net"],
    ["AAAA", "blog.ai-kit.net"],
    ["A", "www.ai-kit.net"],
    ["A", "not-ai-kit.net"],
    ["A", "jobs.ai-kit.net.evil.example"],
    ["MX", "ai-kit.net"],
    ["MX", "data.ai-kit.net"],
    ["TXT", "ai-kit.net"],
    ["TXT", "jobs.ai-kit.net"],
    ["TXT", "data.ai-kit.net"],
    ["CNAME", "ai-kit.net"],
    ["CNAME", "jobs.ai-kit.net"],
    ["CNAME", "data.ai-kit.net"],
    ["NS", "ai-kit.net"],
    ["CAA", "ai-kit.net"],
  ])("keeps %s %s", (type, name) => {
    expect(isConflictingAddressRecord({ type, name })).toBe(false);
  });
});
