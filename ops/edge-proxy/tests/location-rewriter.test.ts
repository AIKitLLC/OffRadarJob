import { describe, expect, it } from "vitest";
import { LocationRewriter } from "../src/location-rewriter.js";

const rewriter = new LocationRewriter();

describe("Location rewrite", () => {
  it("rewrites the upstream workers.dev host back to the public host", () => {
    const location = rewriter.rewrite(
      "https://ai-kit-net.tuannx87.workers.dev/login?next=1",
      "ai-kit-net.tuannx87.workers.dev",
      "ai-kit.net",
    );
    expect(location).toBe("https://ai-kit.net/login?next=1");
  });

  it("rewrites a mixed-case host and drops an explicit port", () => {
    const location = rewriter.rewrite(
      "https://AI-KIT-NET.tuannx87.workers.dev:443/dashboard#top",
      "ai-kit-net.tuannx87.workers.dev",
      "ai-kit.net",
    );
    expect(location).toBe("https://ai-kit.net/dashboard#top");
  });

  it("leaves relative redirects and foreign hosts unchanged", () => {
    expect(rewriter.rewrite("/login", "ai-kit-net.tuannx87.workers.dev", "ai-kit.net")).toBe("/login");
    expect(
      rewriter.rewrite("https://accounts.google.com/o/oauth", "ai-kit-net.tuannx87.workers.dev", "ai-kit.net"),
    ).toBe("https://accounts.google.com/o/oauth");
  });

  it("does not rewrite a lookalike host that merely contains the upstream name", () => {
    const foreign = "https://ai-kit-net.tuannx87.workers.dev.evil.example/phish";
    expect(rewriter.rewrite(foreign, "ai-kit-net.tuannx87.workers.dev", "ai-kit.net")).toBe(foreign);
  });
});
