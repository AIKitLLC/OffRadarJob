import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative } from "node:path";

// ADR 0004: pure domain packages may import only from themselves and an allowlist.
// Adding an entry here requires updating docs/adr/0004-pure-domain-packages.md first.

const COMMON = ["src/types/domain.ts", "src/matching/stable-hash.ts"];
const PACKAGES: Record<string, string[]> = {
  "src/cv-strategy": [...COMMON, "src/services/cv-tag-cloud.ts"],
  "src/applications": COMMON,
  "src/community": [...COMMON, "src/services/apply-url-guard.ts"],
  "src/analytics": COMMON,
};
const BARE_ALLOWED = new Set(["zod"]);

const SPECIFIER_RE = /(?:import|export)\s[^'"]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)|import\s+["']([^"']+)["']/g;

function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return tsFiles(path);
    return path.endsWith(".ts") ? [path] : [];
  });
}

export function importViolations(pkg: string, file: string, source: string): string[] {
  const allowed = PACKAGES[pkg] ?? [];
  const violations: string[] = [];
  for (const match of source.matchAll(SPECIFIER_RE)) {
    const spec = match[1] ?? match[2] ?? match[3] ?? "";
    if (spec.startsWith(".")) {
      const target = normalize(join(dirname(file), spec)).replace(/\.js$/, ".ts");
      const insidePackage = !relative(pkg, target).startsWith("..");
      if (!insidePackage && !allowed.includes(target)) violations.push(`${file} -> ${spec}`);
    } else if (!BARE_ALLOWED.has(spec)) {
      violations.push(`${file} -> ${spec}`);
    }
  }
  if (/\bfetch\s*\(/.test(source)) violations.push(`${file} -> fetch()`);
  return violations;
}

describe("ADR 0004 package boundaries", () => {
  it("the checker catches forbidden imports and network calls", () => {
    const file = "src/cv-strategy/x.ts";
    expect(importViolations("src/cv-strategy", file, `import { a } from "./types.js";`)).toEqual([]);
    expect(importViolations("src/cv-strategy", file, `import { Ok } from "../types/domain.js";`)).toEqual([]);
    expect(importViolations("src/cv-strategy", file, `import { z } from "zod";`)).toEqual([]);
    expect(importViolations("src/cv-strategy", file, `import { JobRepository } from "../db/repositories.js";`)).toHaveLength(1);
    expect(importViolations("src/cv-strategy", file, `import { x } from "../http/candidate-match-routes.js";`)).toHaveLength(1);
    expect(importViolations("src/cv-strategy", file, `import { readFileSync } from "node:fs";`)).toHaveLength(1);
    expect(importViolations("src/cv-strategy", file, `const m = await import("../db/types.js");`)).toHaveLength(1);
    expect(importViolations("src/cv-strategy", file, `export { y } from "../services/decision-api.js";`)).toHaveLength(1);
    expect(importViolations("src/cv-strategy", file, `await fetch("https://x.example")`)).toHaveLength(1);
    expect(importViolations("src/applications", "src/applications/x.ts", `import { CvTagCloudService } from "../services/cv-tag-cloud.js";`)).toHaveLength(1);
  });

  it("at least one package exists, so the rule is not vacuous", () => {
    expect(Object.keys(PACKAGES).some((pkg) => existsSync(pkg))).toBe(true);
  });

  for (const pkg of Object.keys(PACKAGES)) {
    it(`${pkg} imports only itself and its allowlist`, () => {
      if (!existsSync(pkg)) return;
      const violations = tsFiles(pkg).flatMap((file) => importViolations(pkg, file, readFileSync(file, "utf8")));
      expect(violations).toEqual([]);
    });
  }
});
