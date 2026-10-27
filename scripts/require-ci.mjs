// Refuses to continue outside GitHub Actions. Deploy and remote-migration
// npm scripts run this first, so they stop on a developer machine (#9).
// This is a guardrail against accidental local deploys, not a security
// boundary: calling `wrangler` directly skips it. The real control is that
// deploy-capable Cloudflare credentials live only in the CI environment.

if (process.env.GITHUB_ACTIONS !== "true") {
  console.error(
    [
      "Refusing to run: deploys and remote D1 migrations run only in GitHub Actions (issue #9).",
      "Merge to main and let .github/workflows/ci.yml deploy.",
    ].join("\n"),
  );
  process.exit(1);
}
