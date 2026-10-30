/** Address records that block custom hostnames on the zone apex and jobs host. */
export const CONFLICTING_ADDRESS_NAMES = ["ai-kit.net", "jobs.ai-kit.net"] as const;
export const CONFLICTING_ADDRESS_TYPES = ["A", "AAAA"] as const;

const NAMES = new Set<string>(CONFLICTING_ADDRESS_NAMES);
const TYPES = new Set<string>(CONFLICTING_ADDRESS_TYPES);

export interface DnsRecordIdentity {
  id: string;
  type: string;
  name: string;
}

export function conflictingAddressQueries(): Array<{ type: string; name: string }> {
  const queries: Array<{ type: string; name: string }> = [];
  for (const type of CONFLICTING_ADDRESS_TYPES) {
    for (const name of CONFLICTING_ADDRESS_NAMES) queries.push({ type, name });
  }
  return queries;
}

export function normalizeDnsName(name: string): string {
  return name.trim().toLowerCase().replace(/\.$/, "");
}

/** True only for A/AAAA records whose name is exactly the apex or jobs host. */
export function isConflictingAddressRecord(record: { type: string; name: string }): boolean {
  return TYPES.has(record.type.trim().toUpperCase()) && NAMES.has(normalizeDnsName(record.name));
}

/** Cloudflare DNS and zone identifiers are 32 hex characters. */
export function isDnsIdentifier(value: string): boolean {
  return /^[a-f0-9]{32}$/i.test(value);
}
