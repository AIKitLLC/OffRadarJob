import { describe, expect, it } from "vitest";
import { SetCookieRewriter } from "../src/set-cookie-rewriter.js";

const rewriter = new SetCookieRewriter();

describe("Set-Cookie rewrite", () => {
  it("rewrites a Domain that mentions workers.dev to the public host", () => {
    const cookie = rewriter.rewrite(
      "sid=1; Domain=ai-kit-net.tuannx87.workers.dev; Path=/; Secure",
      "ai-kit.net",
    );
    expect(cookie).toBe("sid=1; Domain=ai-kit.net; Path=/; Secure");
  });

  it("rewrites a quoted, dotted, mixed-case Domain", () => {
    const cookie = rewriter.rewrite(
      'theme=dark; Domain=".Off-Radar-Jobs.tuannx87.workers.dev"; HttpOnly',
      "jobs.ai-kit.net",
    );
    expect(cookie).toBe('theme=dark; Domain="jobs.ai-kit.net"; HttpOnly');
  });

  it("leaves cookies whose Domain is not workers.dev unchanged", () => {
    const untouched = "id=1; Domain=example.com; Path=/";
    expect(rewriter.rewrite(untouched, "ai-kit.net")).toBe(untouched);
    expect(rewriter.rewrite("id=1; Path=/", "ai-kit.net")).toBe("id=1; Path=/");
  });
});
