import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildUpstreamFetchInit } from "../src/upstream-fetch-init.js";

const PROBE_SCRIPT = `
export default {
  async fetch(request) {
    const mode = new URL(request.url).searchParams.get("mode");
    const init = { method: "GET", redirect: "manual" };
    if (mode === "both") {
      init.cache = "no-store";
      init.cf = { cacheTtl: 0 };
    } else if (mode === "cache") {
      init.cache = "no-store";
    } else if (mode === "ttl") {
      init.cf = { cacheTtl: 0 };
    }
    try {
      if (mode === "detached") {
        const holder = { fetchImpl: fetch };
        await holder.fetchImpl("https://example.com/");
      } else {
        await fetch("https://example.com/", init);
      }
      return new Response("accepted", { status: 200 });
    } catch (error) {
      const name = error instanceof Error ? error.name : "Error";
      const message = error instanceof Error ? error.message : "unknown";
      return new Response(name + ": " + message, { status: 599 });
    }
  }
}
`;

describe("upstream fetch init", () => {
  it("omits cache and duplex and keeps cf.cacheTtl 0", () => {
    const init = buildUpstreamFetchInit(new Request("https://ai-kit.net/"), new Headers());
    expect(init).not.toHaveProperty("cache");
    expect(init).not.toHaveProperty("duplex");
    expect(init.cf).toEqual({ cacheTtl: 0 });
    expect(init.redirect).toBe("manual");
  });
});

describe("workerd cache init", () => {
  let mf: Miniflare;

  beforeAll(async () => {
    mf = new Miniflare({
      workers: [
        {
          config: {
            name: "cache-probe",
            compatibilityDate: "2025-02-24",
            manifest: {
              mainModule: "index.js",
              modules: {
                "index.js": { type: "esm", contents: PROBE_SCRIPT },
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

  async function probe(mode: string): Promise<string> {
    const response = await mf.dispatchFetch(`https://ai-kit.net/?mode=${mode}`);
    return response.text();
  }

  it("reproduces the runtime TypeError for cache no-store combined with cacheTtl 0", async () => {
    expect(await probe("both")).toBe("TypeError: CacheTtl: 0, is not compatible with cache: no-store header.");
  });

  it("accepts cache no-store alone under compatibility date 2025-02-24", async () => {
    const body = await probe("cache");
    expect(body).not.toContain("is not implemented");
    expect(body).not.toContain("is not compatible with cache");
  });

  it("accepts cf.cacheTtl 0 without the cache field", async () => {
    const body = await probe("ttl");
    expect(body).not.toContain("is not implemented");
    expect(body).not.toContain("is not compatible with cache");
  });

  it("reproduces the runtime TypeError when fetch is called with the wrong this", async () => {
    expect(await probe("detached")).toContain("Illegal invocation");
  });
});
