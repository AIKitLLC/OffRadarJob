const DOMAIN_ATTRIBUTE = /(^|;\s*)(Domain\s*=\s*)("[^"]*"|[^;]*)/gi;

/** Point Set-Cookie Domain values that still name workers.dev at the public host. */
export class SetCookieRewriter {
  rewrite(cookie: string, publicHost: string): string {
    return cookie.replace(DOMAIN_ATTRIBUTE, (full, separator: string, name: string, rawValue: string) => {
      const unquoted = rawValue.replace(/^"|"$/g, "").trim();
      if (!unquoted.toLowerCase().includes("workers.dev")) return full;
      const next = rawValue.trimStart().startsWith('"') ? `"${publicHost}"` : publicHost;
      return `${separator}${name}${next}`;
    });
  }
}
