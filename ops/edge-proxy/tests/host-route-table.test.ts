import { describe, expect, it } from "vitest";
import { productionHostRoutes } from "../src/host-route-table.js";

describe("host mapping", () => {
  it("maps the apex zone to the marketing Worker", () => {
    expect(productionHostRoutes.resolve("ai-kit.net")).toBe("ai-kit-net.tuannx87.workers.dev");
  });

  it("maps the jobs host to the jobs Worker", () => {
    expect(productionHostRoutes.resolve("jobs.ai-kit.net")).toBe("off-radar-jobs.tuannx87.workers.dev");
  });

  it("maps the data host to the NHTSA edge API", () => {
    expect(productionHostRoutes.resolve("data.ai-kit.net")).toBe("nhtsa-edge-api.tuannx87.workers.dev");
    expect(productionHostRoutes.resolve("Data.AI-KIT.net")).toBe("nhtsa-edge-api.tuannx87.workers.dev");
  });

  it("matches hosts case-insensitively", () => {
    expect(productionHostRoutes.resolve("Jobs.AI-KIT.net")).toBe("off-radar-jobs.tuannx87.workers.dev");
  });

  it("does not map unknown hosts", () => {
    expect(productionHostRoutes.resolve("www.ai-kit.net")).toBeUndefined();
    expect(productionHostRoutes.resolve("evil.example")).toBeUndefined();
  });
});
