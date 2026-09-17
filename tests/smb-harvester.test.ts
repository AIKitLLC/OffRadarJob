import { describe, it, expect } from "vitest";
import { SMB_CATALOGUE, SmbHarvester } from "../src/harvesters/smb-harvester.js";

describe("Cross-Industry US SMB Catalogue & Harvester", () => {
  it("should have 41 verified US SMB targets across 9 distinct industry groups", () => {
    expect(SMB_CATALOGUE.length).toBe(41);

    const groups = new Set(SMB_CATALOGUE.map((t) => t.industryGroup));
    expect(groups.size).toBe(9);
    expect(groups.has("healthcare_biotech")).toBe(true);
    expect(groups.has("cleantech_energy")).toBe(true);
    expect(groups.has("manufacturing_robotics")).toBe(true);
    expect(groups.has("fintech_insurtech")).toBe(true);
    expect(groups.has("logistics_proptech")).toBe(true);
    expect(groups.has("retail_ecommerce")).toBe(true);
    expect(groups.has("foodtech_agriculture")).toBe(true);
    expect(groups.has("edtech_legaltech")).toBe(true);
    expect(groups.has("hrtech_smb_ops")).toBe(true);
  });

  it("should have valid ATS configurations for all SMB targets", () => {
    for (const target of SMB_CATALOGUE) {
      expect(["ashby", "greenhouse", "lever"]).toContain(target.atsType);
      expect(target.atsToken).toBeTruthy();
      expect(target.domain).toBeTruthy();
      expect(target.websiteUrl.startsWith("http")).toBe(true);
    }
  });

  it("should generate foreign-key safe SQL statements for companies, pages, and jobs", () => {
    const harvester = new SmbHarvester();
    const sampleTarget = SMB_CATALOGUE[0]!;
    const sampleJobs = [
      {
        companyDomain: sampleTarget.domain,
        companyName: sampleTarget.name,
        title: "Senior Product Engineer",
        department: "Engineering",
        employmentType: "full-time" as const,
        location: "Remote - US",
        isRemote: true,
        applyUrl: "https://example.com/apply/1",
        jobUrl: "https://example.com/job/1",
        descriptionSummary: "Test job",
        skills: ["TypeScript", "PostgreSQL"],
        seniorityLevel: "senior" as const,
        techCategory: "fullstack" as const,
      },
    ];

    const { companySqls, careerPageSqls, jobSqls } = harvester.generateStatements(
      [sampleTarget],
      { [sampleTarget.id]: sampleJobs }
    );

    expect(companySqls.length).toBe(1);
    expect(companySqls[0]).toContain("INSERT INTO companies");
    expect(companySqls[0]).toContain("ON CONFLICT(domain) DO UPDATE");

    expect(careerPageSqls.length).toBe(1);
    expect(careerPageSqls[0]).toContain("INSERT OR IGNORE INTO career_pages");
    expect(careerPageSqls[0]).toContain("FROM companies c WHERE c.domain =");

    expect(jobSqls.length).toBe(1);
    expect(jobSqls[0]).toContain("INSERT INTO jobs");
    expect(jobSqls[0]).toContain("FROM companies c");
    expect(jobSqls[0]).toContain("ON CONFLICT(content_hash) DO UPDATE");
  });
});
