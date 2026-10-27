import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

// Issue #9: deploys and remote D1 migrations run only in GitHub Actions.

function runGuard(env: Record<string, string>) {
  const base: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined && key !== "GITHUB_ACTIONS") base[key] = value;
  }
  return spawnSync(process.execPath, ["scripts/require-ci.mjs"], {
    env: { ...base, ...env },
    encoding: "utf8",
  });
}

describe("scripts/require-ci.mjs", () => {
  it("exits 1 with a clear message outside GitHub Actions", () => {
    const result = runGuard({});
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("only in GitHub Actions");
  });

  it("does not accept look-alike values", () => {
    expect(runGuard({ GITHUB_ACTIONS: "1" }).status).toBe(1);
    expect(runGuard({ GITHUB_ACTIONS: "TRUE" }).status).toBe(1);
    expect(runGuard({ CI: "true" }).status).toBe(1);
  });

  it("exits 0 inside GitHub Actions", () => {
    expect(runGuard({ GITHUB_ACTIONS: "true" }).status).toBe(0);
  });
});

describe("package.json scripts", () => {
  const scripts = (JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> }).scripts;

  it("guards deploy and remote migrations", () => {
    expect(scripts["deploy"]).toMatch(/^node scripts\/require-ci\.mjs && /);
    expect(scripts["db:migrate:remote"]).toMatch(/^node scripts\/require-ci\.mjs && /);
  });

  it("has no other script that deploys or touches the remote database without the guard", () => {
    for (const [name, command] of Object.entries(scripts)) {
      if (/wrangler deploy|--remote/.test(command)) {
        expect(command, name).toMatch(/^node scripts\/require-ci\.mjs && /);
      }
    }
  });
});

describe(".github/workflows/ci.yml deploy job", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");

  it("fails instead of skipping when Cloudflare credentials are missing", () => {
    expect(workflow).not.toContain("configured == 'true'");
    expect(workflow).not.toMatch(/::notice::Skipping/);
    expect(workflow).toContain("::error::CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set");
  });

  it("migrates and deploys through the guarded npm scripts", () => {
    expect(workflow).toContain("run: npm run db:migrate:remote");
    expect(workflow).toContain("run: npm run deploy");
    expect(workflow).not.toMatch(/run: npm exec -- wrangler/);
  });
});
