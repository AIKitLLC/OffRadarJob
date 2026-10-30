import { CloudflareApi } from "./cloudflare-api.js";
import {
  conflictingAddressQueries,
  isConflictingAddressRecord,
  isDnsIdentifier,
  normalizeDnsName,
  type DnsRecordIdentity,
} from "./conflicting-address-record.js";

const ZONE_NAME = "ai-kit.net";
const MAX_PAGES = 5;
const MAX_DELETES = 20;

export interface ClearConflictingAddressRecordsOptions {
  token: string;
  accountId: string;
  fetchImpl?: typeof fetch;
  log?: (line: string) => void;
}

function requireIdentifier(value: string, label: string): void {
  if (!isDnsIdentifier(value)) throw new Error(`${label} is not a 32-character hex id`);
}

function asRecordList(result: unknown): unknown[] {
  if (!Array.isArray(result)) throw new Error("Cloudflare API result was not a list");
  return result;
}

function readZone(result: unknown, accountId: string): string {
  const zones = asRecordList(result);
  if (zones.length !== 1) throw new Error(`expected exactly one zone named ${ZONE_NAME}`);
  const zone = zones[0];
  if (!zone || typeof zone !== "object") throw new Error("zone payload was empty");
  const body = zone as Record<string, unknown>;
  if (body.name !== ZONE_NAME) throw new Error(`zone name was not ${ZONE_NAME}`);
  const account = body.account;
  const accountFromApi =
    account && typeof account === "object" ? (account as Record<string, unknown>).id : undefined;
  if (accountFromApi !== accountId) throw new Error("zone account did not match CLOUDFLARE_ACCOUNT_ID");
  if (typeof body.id !== "string" || !isDnsIdentifier(body.id)) throw new Error("zone id was not a 32-character hex id");
  return body.id;
}

function considerRecord(value: unknown, query: { type: string; name: string }): DnsRecordIdentity | undefined {
  if (!value || typeof value !== "object") throw new Error("DNS record payload was empty");
  const body = value as Record<string, unknown>;
  if (typeof body.type !== "string" || typeof body.name !== "string" || typeof body.id !== "string") {
    throw new Error("DNS record was missing id, type, or name");
  }
  const type = body.type.trim().toUpperCase();
  const name = normalizeDnsName(body.name);
  if (type !== query.type || name !== query.name) return undefined;
  if (!isConflictingAddressRecord({ type, name })) return undefined;
  if (!isDnsIdentifier(body.id)) throw new Error("refusing a DNS record id that is not 32 hex characters");
  return { id: body.id, type, name };
}

async function listQuery(
  api: CloudflareApi,
  zoneId: string,
  type: string,
  name: string,
): Promise<DnsRecordIdentity[]> {
  const found: DnsRecordIdentity[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const params = new URLSearchParams({
      type,
      name,
      per_page: "100",
      page: String(page),
    });
    const envelope = await api.get(`/client/v4/zones/${zoneId}/dns_records?${params}`);
    const totalPages = envelope.resultInfo.totalPages;
    if (!Number.isInteger(totalPages) || totalPages < 1 || totalPages > MAX_PAGES) {
      throw new Error("DNS list pagination was outside the safety cap");
    }
    for (const entry of asRecordList(envelope.result)) {
      const record = considerRecord(entry, { type, name });
      if (record) found.push(record);
    }
    if (page >= totalPages) return found;
  }
  throw new Error("DNS list pagination was outside the safety cap");
}

function dedupe(records: readonly DnsRecordIdentity[]): DnsRecordIdentity[] {
  const seen = new Set<string>();
  const unique: DnsRecordIdentity[] = [];
  for (const record of records) {
    if (seen.has(record.id)) continue;
    seen.add(record.id);
    unique.push(record);
  }
  return unique;
}

/**
 * Delete stale A/AAAA records on ai-kit.net, jobs.ai-kit.net, and data.ai-kit.net so custom hostnames can attach.
 * Every other name and type is left untouched.
 */
export async function clearConflictingAddressRecords(options: ClearConflictingAddressRecordsOptions): Promise<void> {
  if (options.token.length === 0) throw new Error("CLOUDFLARE_API_TOKEN is required");
  requireIdentifier(options.accountId, "CLOUDFLARE_ACCOUNT_ID");

  const api = new CloudflareApi(options.token, options.fetchImpl ?? fetch);
  const log = options.log ?? ((line: string) => console.log(line));

  const zoneParams = new URLSearchParams({
    name: ZONE_NAME,
    "account.id": options.accountId,
    per_page: "50",
    page: "1",
  });
  const zoneEnvelope = await api.get(`/client/v4/zones?${zoneParams}`);
  const zoneId = readZone(zoneEnvelope.result, options.accountId);

  const found: DnsRecordIdentity[] = [];
  for (const query of conflictingAddressQueries()) {
    found.push(...(await listQuery(api, zoneId, query.type, query.name)));
  }
  const records = dedupe(found);
  if (records.length > MAX_DELETES) throw new Error("refusing to delete more than 20 DNS records");

  for (const record of records) {
    if (!isConflictingAddressRecord(record) || !isDnsIdentifier(record.id)) {
      throw new Error("refusing to delete a record outside the A/AAAA allowlist");
    }
    await api.delete(`/client/v4/zones/${zoneId}/dns_records/${record.id}`);
    log(`${record.type} ${record.name} ${record.id}`);
  }
}
