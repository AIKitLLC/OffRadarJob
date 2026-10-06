/**
 * Domains that make the public feed noisy instead of off-radar.
 * ponytail: keep this static until source volume justifies an allowlisted source table.
 */
export const IGNORED_SOURCE_DOMAINS = [
  "adzuna.co.uk",
  "adzuna.com",
  "amazon.com",
  "apple.com",
  "builtin.com",
  "careerbuilder.com",
  "dice.com",
  "facebook.com",
  "fiverr.com",
  "flexjobs.com",
  "glassdoor.com",
  "github.com",
  "google.com",
  "indeed.com",
  "itviec.com",
  "jobcase.com",
  "jooble.org",
  "linkedin.com",
  "meta.com",
  "microsoft.com",
  "monster.com",
  "reddit.com",
  "reed.co.uk",
  "remoteok.com",
  "simplyhired.com",
  "snagajob.com",
  "topcv.vn",
  "totaljobs.com",
  "twitter.com",
  "upwork.com",
  "vietnamworks.com",
  "wellfound.com",
  "weworkremotely.com",
  "wikipedia.org",
  "x.com",
  "youtube.com",
  "ziprecruiter.com",
] as const;

export function normalizeDomain(input?: string | null): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "";
  try {
    const url = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return raw.toLowerCase().replace(/^www\./, "").split("/")[0] ?? "";
  }
}

export function isIgnoredSourceDomain(input?: string | null): boolean {
  const domain = normalizeDomain(input);
  return IGNORED_SOURCE_DOMAINS.some(
    (ignored) => domain === ignored || domain.endsWith(`.${ignored}`)
  );
}

export function ignoredSourceSql(alias: string): string {
  const domain = `LOWER(COALESCE(${alias}.domain, ''))`;
  const matches = IGNORED_SOURCE_DOMAINS.map(
    (ignored) => `${domain} = '${ignored}' OR ${domain} LIKE '%.${ignored}'`
  ).join(" OR ");
  return `NOT (${matches})`;
}
