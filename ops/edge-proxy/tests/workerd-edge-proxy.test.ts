import * as esbuild from "esbuild";
import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";

const entryPoint = fileURLToPath(new URL("../src/index.ts", import.meta.url));

describe("bundled edge proxy in workerd", () => {
  let mf: Miniflare;

  beforeAll(async () => {
    const built = await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      format: "esm",
      platform: "neutral",
      write: false,
      logLevel: "silent",
    });
    const script = built.outputFiles[0]?.text;
    if (!script) throw new Error("edge proxy bundle was empty");
    mf = new Miniflare({
      workers: [
        {
          config: {
            name: "ai-kit-edge-proxy",
            compatibilityDate: "2025-02-24",
            manifest: {
              mainModule: "index.js",
              modules: {
                "index.js": { type: "esm", contents: script },
              },
            },
          },
        },
      ],
    });
    await mf.ready;
  });

  afterAll(async () => {
    await mf.dispose();
  });

  it("returns 404 for an unknown host", async () => {
    const response = await mf.dispatchFetch("https://www.ai-kit.net/secret");
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not Found");
  });

  it("proxies the public hosts without an uncaught exception", async () => {
    for (const url of ["https://ai-kit.net/", "https://jobs.ai-kit.net/"]) {
      const response = await mf.dispatchFetch(url);
      const text = await response.text();
      expect(response.status, url).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(text).not.toContain("Bad Gateway");
      expect(text).not.toContain("error code: 1101");
      expect(text.toLowerCase()).toContain("<!doctype html");
    }
  }, 20000);
});
