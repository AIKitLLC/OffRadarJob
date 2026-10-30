function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Swap an absolute redirect's origin workers.dev host for the public host. */
export class LocationRewriter {
  rewrite(location: string, upstreamHost: string, publicHost: string): string {
    let parsed: URL;
    try {
      parsed = new URL(location);
    } catch {
      return location;
    }
    if (parsed.hostname.toLowerCase() !== upstreamHost.toLowerCase()) return location;
    const pattern = new RegExp(`//${escapeRegExp(parsed.hostname)}(?::\\d+)?(?=[/?#]|$)`, "i");
    return location.replace(pattern, `//${publicHost}`);
  }
}
