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
  reason?:
    | "not_http"
    | "malformed"
    | "linkedin"
    | "error_param"
    | "generic_careers_page"
    | "blocked_host"
    | "email_protection";
}

const GENERIC_PATH_RE =
  /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:careers?|jobs|join(?:-us)?|work-with-us|open-positions|openings|positions|about\/careers|company\/careers)?\/?$/i;

const CF_EMAIL_PROTECTION_RE =
  /(?:\/cdn-cgi\/l\/email-protection(?:#|\?)|data-cfemail=["']?)\s*([0-9a-fA-F]{4,})/i;

/**
 * Decode a Cloudflare email-protection hex payload (XOR with first byte).
 * Accepts a full `/cdn-cgi/l/email-protection#...` URL, `?` query, `data-cfemail` attribute, or raw hex.
 * Returns a lowercase email address when valid, or null if not decodable.
 */
export function decodeCloudflareEmailProtection(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.trim();
  const match = raw.match(CF_EMAIL_PROTECTION_RE);
  const hex = match?.[1] ?? (/^[0-9a-fA-F]{6,}$/.test(raw) ? raw : null);
  if (!hex || hex.length < 6 || hex.length % 2 !== 0) return null;

  const key = Number.parseInt(hex.slice(0, 2), 16);
  if (!Number.isFinite(key)) return null;

  let decoded = "";
  for (let i = 2; i < hex.length; i += 2) {
    const byte = Number.parseInt(hex.slice(i, i + 2), 16);
    if (!Number.isFinite(byte)) return null;
    decoded += String.fromCharCode(byte ^ key);
  }

  const email = decoded.trim().split("?")[0]?.trim().toLowerCase() ?? "";
  if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) {
    return email;
  }
  return null;
}

/** True when a string or URL points to Cloudflare's `/cdn-cgi/l/email-protection` obfuscator. */
export function isCloudflareEmailProtectionUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  return /\/cdn-cgi\/l\/email-protection/i.test(raw);
}

/**
 * Normalize an apply target before validation/upsert:
 * - Decodes Cloudflare `/cdn-cgi/l/email-protection#...` URLs into `{ applyType: 'email', applyTarget: decodedEmail }`.
 * - Converts `mailto:...` URLs passed with `url`/`form` into `{ applyType: 'email', applyTarget: email }`.
 */
export function normalizeApplyTarget(
  applyType: string,
  applyTarget: string
): { applyType: string; applyTarget: string } {
  const trimmed = (applyTarget ?? "").trim();
  if (/^mailto:/i.test(trimmed)) {
    const mail = trimmed.replace(/^mailto:/i, "").split("?")[0]?.trim().toLowerCase() ?? "";
    if (mail && mail.includes("@")) {
      return { applyType: "email", applyTarget: mail };
    }
  }
  if (isCloudflareEmailProtectionUrl(trimmed)) {
    const decoded = decodeCloudflareEmailProtection(trimmed);
    if (decoded) {
      return { applyType: "email", applyTarget: decoded };
    }
  }
  return { applyType, applyTarget: trimmed };
}

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
  if (
    url.pathname.toLowerCase().includes("/cdn-cgi/l/email-protection") ||
    url.pathname.toLowerCase().startsWith("/cdn-cgi/")
  ) {
    return { ok: false, reason: "email_protection" };
  }
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

/** Ingest gate: email/handle applies must be valid non-cdn-cgi targets; URL applies must pass validateApplyUrl. */
export function isAcceptableApplyTarget(applyType: string, applyTarget: string): boolean {
  if (isCloudflareEmailProtectionUrl(applyTarget)) return false;
  if (applyType === "email") {
    const clean = applyTarget.trim();
    return clean.includes("@") && !clean.startsWith("http://") && !clean.startsWith("https://");
  }
  if (applyType === "discord" || applyType === "x_dm") return true;
  return validateApplyUrl(applyTarget).ok;
}
