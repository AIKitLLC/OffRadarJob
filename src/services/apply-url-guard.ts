/**
 * Network-free apply URL policy. Used at ingest and again before every outbound
 * request, including each redirect hop.
 *
 * Rejects hosts that are not public site names: localhost, internal suffixes,
 * address literals (including private, loopback, and link-local), and names
 * that embed an address.
 */

export interface StaticValidation {
  ok: boolean;
  reason?: "not_http" | "malformed" | "linkedin" | "error_param" | "generic_careers_page" | "blocked_host";
}

const GENERIC_PATH_RE =
  /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:careers?|jobs|join(?:-us)?|work-with-us|open-positions|openings|positions|about\/careers|company\/careers)?\/?$/i;

const INTERNAL_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".localdomain", ".intranet", ".lan"];

/** Public DNS names whose labels encode the address they resolve to. */
const EMBEDDED_ADDRESS_SUFFIXES = [".nip.io", ".sslip.io", ".xip.io", ".localtest.me", ".lvh.me", ".vcap.me"];

function normalizedHost(hostname: string): string {
  let host = hostname.trim().toLowerCase();
  while (host.endsWith(".")) host = host.slice(0, -1);
  return host;
}

function isIpLiteral(host: string): boolean {
  const bare = host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
  if (bare.includes(":")) return true;
  if (/^\d+$/.test(bare) || /^0x[0-9a-f]+$/i.test(bare)) return true;
  if (/^(?:\d+\.)+\d+$/.test(bare)) return true;
  return false;
}

/** True when this host must not be requested by the link checker. */
export function isBlockedApplyHost(hostname: string): boolean {
  const host = normalizedHost(hostname);
  if (!host || host === ".") return true;
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (INTERNAL_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  if (EMBEDDED_ADDRESS_SUFFIXES.some((suffix) => host === suffix.slice(1) || host.endsWith(suffix))) return true;
  if (isIpLiteral(host)) return true;
  if (!host.includes(".")) return true;
  return false;
}

function hasJobIdentifierQuery(url: URL): boolean {
  for (const key of ["gh_jid", "jobid", "job_id", "jid", "id", "pid", "posting"]) {
    if (url.searchParams.get(key)) return true;
  }
  return false;
}

/** Static, network-free check of an apply URL. Used at ingest and before every fetch. */
export function validateApplyUrl(raw: string): StaticValidation {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, reason: "not_http" };
  if (isBlockedApplyHost(url.hostname)) return { ok: false, reason: "blocked_host" };
  const host = url.hostname.toLowerCase();
  if (host === "linkedin.com" || host.endsWith(".linkedin.com") || host === "lnkd.in") {
    return { ok: false, reason: "linkedin" };
  }
  if ((url.searchParams.get("error") ?? "").toLowerCase() === "true") return { ok: false, reason: "error_param" };
  if (GENERIC_PATH_RE.test(url.pathname) && !hasJobIdentifierQuery(url)) {
    return { ok: false, reason: "generic_careers_page" };
  }
  return { ok: true };
}

/** Ingest gate: email/handle applies pass through; URL applies must pass validateApplyUrl. */
export function isAcceptableApplyTarget(applyType: string, applyTarget: string): boolean {
  if (applyType === "email" || applyType === "discord" || applyType === "x_dm") return true;
  return validateApplyUrl(applyTarget).ok;
}
