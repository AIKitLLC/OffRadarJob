import { describe, expect, it } from "vitest";
import { renderDashboardHtml, type PublicDashboardStats } from "../src/ui/dashboard.js";

const stripScripts = (html: string) => html.replace(/<script[\s\S]*?<\/script>/g, "");

describe("public dashboard static HTML", () => {
  it("does not contain the sample match score or the unsupported outcome claim", () => {
    const html = renderDashboardHtml();
    expect(html).not.toMatch(/<a[^>]*href="\/admin"/);
    expect(html).not.toContain("55%");
    expect(html).not.toContain("94%");
    expect(html).not.toContain("Significantly boosts interview conversion");
  });

  it("hides counters and shows no placeholder 0 or 100% when no data is available", () => {
    const html = stripScripts(renderDashboardHtml(null));
    expect(html).toContain('<div class="stats-grid" id="stats-grid" hidden>');
    expect(html).not.toMatch(/id="stat-[a-z-]+"[^>]*>\s*0\s*</);
    expect(html).not.toContain(">100%<");
  });

  it("server-renders real counters when stats are provided", () => {
    const stats: PublicDashboardStats = {
      companiesCount: 1234,
      jobsCount: 5678,
      seniorCount: 90,
      midwestPercent: 4,
      regionalBreakdown: { midwest: 227, west: 3000, northeast: 1500, south: 951, mountain: 0 },
    };
    const html = stripScripts(renderDashboardHtml(stats));
    expect(html).toContain('<div class="stats-grid" id="stats-grid">');
    expect(html).toContain('id="stat-companies">1,234<');
    expect(html).toContain('id="stat-jobs">5,678<');
    expect(html).toContain('id="stat-midwest" style="color: #fb7185;">4%<');
    expect(html).toContain('id="stat-reg-west">3,000<');
    expect(html).toContain('id="stat-reg-mountain"><');
  });
});
