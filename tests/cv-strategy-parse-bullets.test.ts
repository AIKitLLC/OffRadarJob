import { describe, expect, it } from "vitest";
import { CV_TEXT_MAX_CHARS, ParsedCvSchema, parseCvBullets, type ParsedCv } from "../src/cv-strategy/index.js";

// Issue #16: CV bullet parser.

function parse(text: string): ParsedCv {
  const result = parseCvBullets(text);
  if (!result.ok) throw result.error;
  return ParsedCvSchema.parse(result.value);
}

const texts = (cv: ParsedCv) => cv.bullets.map((b) => b.text);
const idOf = (cv: ParsedCv, start: string) => cv.bullets.find((b) => b.text.startsWith(start))?.id;

const CV = [
  "Jordan Lee",
  "Senior Software Engineer · Chicago, IL",
  "",
  "EXPERIENCE",
  "Staff Engineer, Northwind — 2021–2025",
  "- Reduced p99 latency from 900 ms to 210 ms for the order API",
  "- Led migration of 40 services to Cloudflare Workers, cutting hosting cost by",
  "  35% across three regions",
  "* Mentored 6 engineers",
  "• Built the on-call runbook",
  "Senior Engineer, Contoso — 2018–2021",
  "1. Shipped the billing ledger",
  "2) Automated release notes",
  "",
  "## Projects",
  "- OffRadarJob: job discovery on Workers, D1 and Queues",
  "",
  "Skills:",
  "- TypeScript, Java, Go",
].join("\n");

describe("parseCvBullets", () => {
  it("reads dash, star, dot and numbered bullets under their sections", () => {
    const cv = parse(CV);
    expect(cv.sections.map((s) => s.title)).toEqual(["EXPERIENCE", "Projects", "Skills"]);
    expect(texts(cv)).toEqual([
      "Reduced p99 latency from 900 ms to 210 ms for the order API",
      "Led migration of 40 services to Cloudflare Workers, cutting hosting cost by 35% across three regions",
      "Mentored 6 engineers",
      "Built the on-call runbook",
      "Shipped the billing ledger",
      "Automated release notes",
      "OffRadarJob: job discovery on Workers, D1 and Queues",
      "TypeScript, Java, Go",
    ]);
    expect(cv.bullets.map((b) => b.marker)).toEqual(["dash", "dash", "star", "dot", "number", "number", "dash", "dash"]);
    const experience = cv.sections[0]!;
    expect(experience.bulletIds).toHaveLength(6);
    expect(cv.bullets.slice(0, 6).every((b) => b.sectionId === experience.id)).toBe(true);
  });

  it("does not glue a role line onto the previous bullet", () => {
    const cv = parse(CV);
    expect(texts(cv).some((t) => t.includes("Contoso"))).toBe(false);
  });

  it("joins a wrapped line that starts lowercase", () => {
    const cv = parse("Experience\n- Cut cloud spend by 30%\n  by batching writes\n");
    expect(texts(cv)).toEqual(["Cut cloud spend by 30% by batching writes"]);
  });

  it("is deterministic", () => {
    expect(parseCvBullets(CV)).toEqual(parseCvBullets(CV));
  });

  it("keeps other ids when one bullet is edited, added or removed", () => {
    const before = parse(CV);
    const edited = parse(CV.replace("Mentored 6 engineers", "Mentored 8 engineers"));
    const added = parse(CV.replace("* Mentored 6 engineers", "- Wrote the incident policy\n* Mentored 6 engineers"));
    const removed = parse(CV.replace("• Built the on-call runbook\n", ""));
    for (const after of [edited, added, removed]) {
      expect(idOf(after, "Reduced p99")).toBe(idOf(before, "Reduced p99"));
      expect(idOf(after, "Shipped the billing")).toBe(idOf(before, "Shipped the billing"));
      expect(idOf(after, "TypeScript")).toBe(idOf(before, "TypeScript"));
    }
    expect(idOf(edited, "Mentored")).not.toBe(idOf(before, "Mentored"));
  });

  it("gives exact repeats distinct ids", () => {
    const cv = parse("Projects\n- Fixed flaky tests\n- Fixed flaky tests\n");
    expect(new Set(cv.bullets.map((b) => b.id)).size).toBe(2);
  });

  it("normalizes CRLF, tabs and non-breaking spaces", () => {
    const cv = parse("Skills\r\n-\tGo and   Rust\r\n");
    expect(texts(cv)).toEqual(["Go and Rust"]);
  });

  it("keeps bullets that come before any heading in an untitled section", () => {
    const cv = parse("- Built a compiler\n\nEducation\n- BS Computer Science");
    expect(cv.sections.map((s) => s.title)).toEqual(["", "Education"]);
  });

  it("returns no bullets for empty input or prose without markers", () => {
    expect(parse("").bullets).toEqual([]);
    expect(parse("Summary\nI build reliable systems for small teams.").bullets).toEqual([]);
  });

  it("ignores a marker with no text", () => {
    expect(parse("Skills\n- \n- Go").bullets.map((b) => b.text)).toEqual(["Go"]);
  });

  it("rejects input over the limit instead of truncating", () => {
    const result = parseCvBullets("x".repeat(CV_TEXT_MAX_CHARS + 1));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/cv_text_too_long/);
    expect(parseCvBullets("x".repeat(CV_TEXT_MAX_CHARS)).ok).toBe(true);
  });
});
