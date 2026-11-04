// Local tooling that writes to the remote production D1 database calls this
// before the write (#9). It throws outside GitHub Actions. Dry runs and local
// SQL generation still work; only the remote write is blocked.
// Same rule as scripts/require-ci.mjs, which guards the npm deploy scripts.

export function requireCi(action: string, env: NodeJS.ProcessEnv = process.env): void {
  if (env["GITHUB_ACTIONS"] !== "true") {
    throw new Error(
      `Refusing to ${action}: remote production writes run only in GitHub Actions (issue #9). ` +
        "Run without the remote step locally, or run it from a CI workflow.",
    );
  }
}
