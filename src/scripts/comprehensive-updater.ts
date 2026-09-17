/**
 * Comprehensive Data Updater & Continuous Scaling Engine for OffRadarJob (Loop 1 & 2)
 *
 * Ingestion Sources:
 * 1. Curated US SMBs & Boutique Tech Studios (90+ companies)
 * 2. Direct ATS JSON Harvester (Ashby, Greenhouse, Lever for 25+ boutique startups: 500+ jobs)
 * 3. Established Remote Tech Companies (78 companies)
 * 4. Multi-Month Hacker News Threads (May to September 2026 - 5 monthly threads, 1000+ comments)
 * 5. GitHub remoteintech Curated Micro & Small Tech Companies (200+ companies)
 *
 * Generates clean, robust SQL batch for Cloudflare D1 with foreign key safety.
 *
 * Usage:
 *   npx tsx src/scripts/comprehensive-updater.ts
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { CURATED_SEEDS } from "../seeds/seed-catalogue.js";
import {
  HackerNewsHarvester,
  GitHubDirectoryHarvester,
  inferSeniority,
  inferTechCategory,
  extractDomainFromUrl,
} from "../harvesters/public-source-harvester.js";
import { AtsHarvester, AtsJobPosting } from "../harvesters/ats-harvester.js";

interface CompanyRecord {
  id: string;
  domain: string;
  name: string;
  tagline: string | null;
  description: string | null;
  websiteUrl: string;
  logoUrl: string | null;
  industry: string | null;
  techStack: string[];
  socialLinks: Record<string, string>;
  contactEmail: string | null;
  headcountEstimate: string | null;
  locationHint: string | null;
  discoverySource: string;
  careersUrl: string | null;
  inlineRoles: Array<{
    title: string;
    location?: string | null;
    employmentType?: string | null;
    applyTarget?: string | null;
    techCategory?: string | null;
    seniorityLevel?: string | null;
    descriptionSummary?: string | null;
    skills?: string[];
  }>;
}

interface AtsTarget {
  domain: string;
  name: string;
  token: string;
  careersUrl: string;
  category: "yc_startups" | "top_vc_portfolio" | "build_in_public";
  tagline?: string;
  description?: string;
  industry?: string;
  locationHint?: string;
}

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return "NULL";
  return `'${String(str).replace(/'/g, "''")}'`;
}

function hashString(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex").substring(0, 32);
}

function isGenericDomain(domain: string): boolean {
  const d = domain.toLowerCase();
  return (
    d === "forms.gle" ||
    d === "docs.google.com" ||
    d === "ashbyhq.com" ||
    d === "jobs.ashbyhq.com" ||
    d === "greenhouse.io" ||
    d === "boards.greenhouse.io" ||
    d === "lever.co" ||
    d === "jobs.lever.co" ||
    d === "linkedin.com" ||
    d === "notion.site" ||
    d === "notion.so"
  );
}

async function main() {
  console.log("===================================================================");
  console.log("🚀 Scaling Engine: YC, Top VC, Build In Public & US Community");
  console.log("===================================================================\n");

  const companyMap = new Map<string, CompanyRecord>();
  const now = Date.now();

  // 1. INGEST CURATED SEEDS (90+ companies)
  console.log(`[1/5] Processing ${CURATED_SEEDS.length} Curated US SMBs & Labs...`);
  for (const seed of CURATED_SEEDS) {
    const domain = extractDomainFromUrl(seed.url);
    if (!domain || isGenericDomain(domain)) continue;

    companyMap.set(domain, {
      id: `comp_${domain.replace(/[^a-z0-9]/g, "_")}`,
      domain,
      name: seed.name,
      tagline: seed.notes || `Boutique software engineering team in ${seed.region}`,
      description: seed.notes || `${seed.name} is an off-radar tech organization located in ${seed.region}.`,
      websiteUrl: seed.url,
      logoUrl: null,
      industry: "Software & Technology",
      techStack: ["TypeScript", "Fullstack", "Cloud"],
      socialLinks: {},
      contactEmail: `jobs@${domain}`,
      headcountEstimate: seed.headcount || "10-50",
      locationHint: seed.region,
      discoverySource: seed.category,
      careersUrl: `${seed.url.replace(/\/$/, "")}/careers`,
      inlineRoles: [],
    });
  }
  console.log(`  -> Accumulated ${companyMap.size} unique companies so far.`);

  // 2. DIRECT ATS HARVESTER (Ashby, Greenhouse, Lever for 58+ YC, VC, & Build In Public startups)
  console.log("\n[2/5] Harvesting Direct ATS Boards (Ashby, Greenhouse, Lever)...");
  const atsHarvester = new AtsHarvester();
  let atsJobsCount = 0;

  const ashbyTargets: AtsTarget[] = [
    // --- Y Combinator Startups ---
    { domain: "cursor.com", name: "Cursor / Anysphere", token: "cursor", careersUrl: "https://jobs.ashbyhq.com/cursor", category: "yc_startups", industry: "AI Developer Tools", tagline: "The AI Code Editor" },
    { domain: "supabase.com", name: "Supabase", token: "supabase", careersUrl: "https://jobs.ashbyhq.com/supabase", category: "yc_startups", industry: "Database & Backend", tagline: "Open Source Firebase Alternative (YC S20)" },
    { domain: "render.com", name: "Render", token: "render", careersUrl: "https://jobs.ashbyhq.com/render", category: "yc_startups", industry: "Cloud Platform", tagline: "Zero DevOps Cloud Platform (YC S19)" },
    { domain: "mintlify.com", name: "Mintlify", token: "mintlify", careersUrl: "https://jobs.ashbyhq.com/mintlify", category: "yc_startups", industry: "Developer Documentation", tagline: "Modern Documentation Platform (YC W22)" },
    { domain: "inngest.com", name: "Inngest", token: "inngest", careersUrl: "https://jobs.ashbyhq.com/inngest", category: "yc_startups", industry: "Workflow Orchestration", tagline: "Event-driven Durability Engine (YC W22)" },
    { domain: "trigger.dev", name: "Trigger.dev", token: "triggerdev", careersUrl: "https://jobs.ashbyhq.com/triggerdev", category: "yc_startups", industry: "Background Jobs", tagline: "Background Jobs Framework (YC W23)" },
    { domain: "vapi.ai", name: "Vapi", token: "vapi", careersUrl: "https://jobs.ashbyhq.com/vapi", category: "yc_startups", industry: "Voice AI", tagline: "Voice AI for Developers (YC W21)" },
    { domain: "vanta.com", name: "Vanta", token: "vanta", careersUrl: "https://jobs.ashbyhq.com/vanta", category: "yc_startups", industry: "Security & Compliance", tagline: "Automated Security & Compliance (YC W18)" },
    { domain: "speakeasyapi.dev", name: "Speakeasy", token: "speakeasy", careersUrl: "https://jobs.ashbyhq.com/speakeasy", category: "yc_startups", industry: "API DevTools", tagline: "The SDK Generation Platform (YC W23)" },
    { domain: "photoroom.com", name: "PhotoRoom", token: "photoroom", careersUrl: "https://jobs.ashbyhq.com/photoroom", category: "yc_startups", industry: "AI Photo Editing", tagline: "AI-Powered Photo Editor (YC W20)" },
    { domain: "depot.dev", name: "Depot", token: "depot", careersUrl: "https://jobs.ashbyhq.com/depot", category: "yc_startups", industry: "Cloud Infrastructure", tagline: "Fast Remote Docker Builds (YC W23)" },

    // --- Top Tier Venture Capital Portfolios (a16z, Sequoia, Benchmark, Founders Fund) ---
    { domain: "livekit.io", name: "LiveKit", token: "livekit", careersUrl: "https://jobs.ashbyhq.com/livekit", category: "top_vc_portfolio", industry: "Real-time Audio & Video", tagline: "Real-time Multimodal AI Stack (Redpoint)" },
    { domain: "modal.com", name: "Modal Labs", token: "modal", careersUrl: "https://jobs.ashbyhq.com/modal", category: "top_vc_portfolio", industry: "Cloud Infrastructure", tagline: "Serverless Cloud for AI/ML (Redpoint, Amplify)" },
    { domain: "fal.ai", name: "fal.ai", token: "fal-ai", careersUrl: "https://jobs.ashbyhq.com/fal-ai", category: "top_vc_portfolio", industry: "Generative AI", tagline: "Lightning Fast Media Models (a16z)" },
    { domain: "tavus.io", name: "Tavus", token: "tavus", careersUrl: "https://jobs.ashbyhq.com/tavus", category: "top_vc_portfolio", industry: "Conversational Video AI", tagline: "Digital Twins & Video Agents (Sequoia)" },
    { domain: "linear.app", name: "Linear", token: "linear", careersUrl: "https://jobs.ashbyhq.com/linear", category: "top_vc_portfolio", industry: "Product Management", tagline: "The Issue Tracking Standard (Sequoia)" },
    { domain: "warp.dev", name: "Warp", token: "warp", careersUrl: "https://jobs.ashbyhq.com/warp", category: "top_vc_portfolio", industry: "Developer Tools", tagline: "The Intelligent Terminal (GV, Dylan Field)" },
    { domain: "decagon.ai", name: "Decagon", token: "decagon", careersUrl: "https://jobs.ashbyhq.com/decagon", category: "top_vc_portfolio", industry: "Enterprise AI Agents", tagline: "AI Customer Support Engine (Accel, a16z)" },
    { domain: "cartesia.ai", name: "Cartesia", token: "cartesia", careersUrl: "https://jobs.ashbyhq.com/cartesia", category: "top_vc_portfolio", industry: "State-Space Models & Audio", tagline: "Real-Time Intelligence on Edge (Index, Lightspeed)" },
    { domain: "poolside.ai", name: "Poolside", token: "poolside", careersUrl: "https://jobs.ashbyhq.com/poolside", category: "top_vc_portfolio", industry: "Frontier AI", tagline: "Building Frontier Software Intelligence (Felicis, Bain)" },
    { domain: "cognition.ai", name: "Cognition", token: "cognition", careersUrl: "https://jobs.ashbyhq.com/cognition", category: "top_vc_portfolio", industry: "Autonomous AI Software", tagline: "Makers of Devin AI Software Engineer (Founders Fund)" },
    { domain: "harvey.ai", name: "Harvey", token: "harvey", careersUrl: "https://jobs.ashbyhq.com/harvey", category: "top_vc_portfolio", industry: "Legal AI", tagline: "Generative AI for Legal & Finance (Sequoia, OpenAI)" },
    { domain: "suno.com", name: "Suno", token: "suno", careersUrl: "https://jobs.ashbyhq.com/suno", category: "top_vc_portfolio", industry: "Music AI", tagline: "Generative Audio & Music Foundation (Matrix, Lightspeed)" },
    { domain: "unstructured.io", name: "Unstructured", token: "unstructured", careersUrl: "https://jobs.ashbyhq.com/unstructured", category: "top_vc_portfolio", industry: "ETL for LLMs", tagline: "Data Ingestion for Enterprise LLMs (Bain)" },
    { domain: "anyscale.com", name: "Anyscale", token: "anyscale", careersUrl: "https://jobs.ashbyhq.com/anyscale", category: "top_vc_portfolio", industry: "Distributed Computing", tagline: "Commercial Ray Platform (a16z)" },
    { domain: "dust.tt", name: "Dust", token: "dust", careersUrl: "https://jobs.ashbyhq.com/dust", category: "top_vc_portfolio", industry: "AI Assistant Platform", tagline: "Custom AI Assistants for Enterprise (Sequoia)" },
    { domain: "baseten.co", name: "Baseten", token: "baseten", careersUrl: "https://jobs.ashbyhq.com/baseten", category: "top_vc_portfolio", industry: "Machine Learning Ops", tagline: "Inference Infrastructure for Fast ML (Greylock, Spark)" },
    { domain: "astronomer.io", name: "Astronomer", token: "astronomer", careersUrl: "https://jobs.ashbyhq.com/astronomer", category: "top_vc_portfolio", industry: "Data Orchestration", tagline: "Managed Apache Airflow Platform (Bain, Sutter Hill)" },
    { domain: "motherduck.com", name: "MotherDuck", token: "motherduck", careersUrl: "https://jobs.ashbyhq.com/motherduck", category: "top_vc_portfolio", industry: "Cloud Analytics", tagline: "Serverless DuckDB in Cloud (a16z, Redpoint)" },
    { domain: "prefect.io", name: "Prefect", token: "prefect", careersUrl: "https://jobs.ashbyhq.com/prefect", category: "top_vc_portfolio", industry: "Data Orchestration", tagline: "Workflow Orchestration Engine (Bessemer)" },
    { domain: "cube.dev", name: "Cube", token: "cube", careersUrl: "https://jobs.ashbyhq.com/cube", category: "top_vc_portfolio", industry: "Semantic Layer", tagline: "Universal Semantic Layer for AI (Decibel, Bain)" },
    { domain: "clickhouse.com", name: "ClickHouse", token: "clickhouse", careersUrl: "https://jobs.ashbyhq.com/clickhouse", category: "top_vc_portfolio", industry: "Real-time Data Warehouse", tagline: "Columnar DBMS for Real-Time Analytics (Index, Benchmark)" },
    { domain: "braintrustdata.com", name: "Braintrust", token: "braintrust", careersUrl: "https://jobs.ashbyhq.com/braintrust", category: "top_vc_portfolio", industry: "AI Evaluations", tagline: "Enterprise LLM Evaluation Platform (a16z)" },
    { domain: "clerk.com", name: "Clerk", token: "clerk", careersUrl: "https://jobs.ashbyhq.com/clerk", category: "top_vc_portfolio", industry: "Authentication & User Management", tagline: "Complete User Management for Next.js & Modern Web (a16z)" },

    // --- Build In Public & Open Core / Bootstrapped Community ---
    { domain: "posthog.com", name: "PostHog", token: "posthog", careersUrl: "https://jobs.ashbyhq.com/posthog", category: "build_in_public", industry: "Product Analytics", tagline: "Open-source Product OS & Transparent Handbook" },
    { domain: "resend.com", name: "Resend", token: "resend", careersUrl: "https://jobs.ashbyhq.com/resend", category: "build_in_public", industry: "Email API", tagline: "Email API for Developers (Built in Public)" },
    { domain: "railway.app", name: "Railway", token: "railway", careersUrl: "https://jobs.ashbyhq.com/railway", category: "build_in_public", industry: "Infrastructure as a Service", tagline: "Instant Cloud Provisioning (Public Changelog & Metrics)" },
    { domain: "langfuse.com", name: "Langfuse", token: "langfuse", careersUrl: "https://jobs.ashbyhq.com/langfuse", category: "build_in_public", industry: "Open Source LLM Engineering", tagline: "Open Source LLM Observability (Build in Public)" },
    { domain: "cal.com", name: "Cal.com", token: "cal.com", careersUrl: "https://jobs.ashbyhq.com/cal.com", category: "build_in_public", industry: "Open Source Scheduling", tagline: "Scheduling Infrastructure for Everyone (Open Core)" },
    { domain: "twenty.com", name: "Twenty", token: "twenty", careersUrl: "https://jobs.ashbyhq.com/twenty", category: "build_in_public", industry: "Open Source CRM", tagline: "The Open Source Salesforce Alternative (Build in Public)" },
    { domain: "infisical.com", name: "Infisical", token: "infisical", careersUrl: "https://jobs.ashbyhq.com/infisical", category: "build_in_public", industry: "Secret Management", tagline: "Open Source Secret Management Platform (Build in Public)" },
    { domain: "kit.com", name: "Kit (ConvertKit)", token: "kit", careersUrl: "https://jobs.ashbyhq.com/kit", category: "build_in_public", industry: "Creator Marketing", tagline: "Bootstrapped & 100% Public Metrics Platform ($40M+ ARR)" },
    { domain: "ghost.org", name: "Ghost", token: "ghost", careersUrl: "https://jobs.ashbyhq.com/ghost", category: "build_in_public", industry: "Independent Publishing", tagline: "Non-profit Open Source Publishing Platform" },
  ];

  const greenhouseTargets: AtsTarget[] = [
    { domain: "tailscale.com", name: "Tailscale", token: "tailscale", careersUrl: "https://tailscale.com/careers", category: "top_vc_portfolio", industry: "Mesh VPN & Security", tagline: "WireGuard Zero Config Mesh VPN (Sequoia, Accel)" },
    { domain: "planetscale.com", name: "PlanetScale", token: "planetscale", careersUrl: "https://planetscale.com/careers", category: "top_vc_portfolio", industry: "Serverless Database", tagline: "MySQL Vitess Database Platform (a16z)" },
    { domain: "cockroachlabs.com", name: "Cockroach Labs", token: "cockroachlabs", careersUrl: "https://www.cockroachlabs.com/careers", category: "top_vc_portfolio", industry: "Distributed SQL", tagline: "Distributed Cloud Database (Benchmark, Index)" },
    { domain: "launchdarkly.com", name: "LaunchDarkly", token: "launchdarkly", careersUrl: "https://launchdarkly.com/careers", category: "top_vc_portfolio", industry: "Feature Management", tagline: "Continuous Delivery & Feature Flags (Bessemer, Redpoint)" },
    { domain: "airtable.com", name: "Airtable", token: "airtable", careersUrl: "https://airtable.com/careers", category: "top_vc_portfolio", industry: "Low-Code Database", tagline: "Connected Enterprise Apps (Benchmark)" },
    { domain: "figma.com", name: "Figma", token: "figma", careersUrl: "https://figma.com/careers", category: "top_vc_portfolio", industry: "Collaborative Design", tagline: "Browser-based Collaborative Interface (Index, Greylock)" },
    { domain: "datadoghq.com", name: "Datadog", token: "datadog", careersUrl: "https://www.datadoghq.com/careers", category: "top_vc_portfolio", industry: "Cloud Monitoring", tagline: "Observability Service for Cloud Applications (Index)" },
    { domain: "brex.com", name: "Brex", token: "brex", careersUrl: "https://brex.com/careers", category: "yc_startups", industry: "Fintech & Corporate Cards", tagline: "AI-Powered Spend Management (YC W17)" },
    { domain: "gusto.com", name: "Gusto", token: "gusto", careersUrl: "https://gusto.com/careers", category: "yc_startups", industry: "Payroll & HR", tagline: "People Platform for Small Businesses (YC W12)" },
    { domain: "flexport.com", name: "Flexport", token: "flexport", careersUrl: "https://www.flexport.com/careers", category: "yc_startups", industry: "Global Logistics", tagline: "Global Trade Platform (YC W14, Founders Fund)" },
    { domain: "lattice.com", name: "Lattice", token: "lattice", careersUrl: "https://lattice.com/careers", category: "yc_startups", industry: "People Success", tagline: "People Management Platform (YC W16)" },
    { domain: "checkr.com", name: "Checkr", token: "checkr", careersUrl: "https://checkr.com/careers", category: "yc_startups", industry: "Background Verification", tagline: "Automated Background Check Platform (YC S14)" },
    { domain: "webflow.com", name: "Webflow", token: "webflow", careersUrl: "https://webflow.com/careers", category: "yc_startups", industry: "Visual Web Development", tagline: "Visual Development Platform (YC W13)" },
    { domain: "coinbase.com", name: "Coinbase", token: "coinbase", careersUrl: "https://coinbase.com/careers", category: "yc_startups", industry: "Crypto & Web3", tagline: "Crypto Financial Services (YC S12)" },
  ];

  const leverTargets: AtsTarget[] = [
    { domain: "neon.tech", name: "Neon", token: "neon", careersUrl: "https://neon.tech/careers", category: "top_vc_portfolio", industry: "Serverless Postgres", tagline: "Serverless Postgres with Branching (Founders Fund, Khosla)" },
  ];

  async function processAtsList(targets: AtsTarget[], fetcher: (domain: string, name: string, token: string) => Promise<AtsJobPosting[]>) {
    for (const t of targets) {
      const jobs = await fetcher(t.domain, t.name, t.token);
      if (jobs.length === 0) continue;

      let comp = companyMap.get(t.domain);
      if (!comp) {
        comp = {
          id: `comp_${t.domain.replace(/[^a-z0-9]/g, "_")}`,
          domain: t.domain,
          name: t.name,
          tagline: t.tagline || `${t.name} engineering team`,
          description: t.description || `${t.name} is a high-growth tech organization backed by ${t.category.replace(/_/g, " ")}.`,
          websiteUrl: `https://${t.domain}`,
          logoUrl: null,
          industry: t.industry || "Software & Technology",
          techStack: ["TypeScript", "Python", "Cloud"],
          socialLinks: {},
          contactEmail: `careers@${t.domain}`,
          headcountEstimate: "20-200",
          locationHint: t.locationHint || "US / Remote",
          discoverySource: t.category,
          careersUrl: t.careersUrl,
          inlineRoles: [],
        };
        companyMap.set(t.domain, comp);
      }

      comp.careersUrl = t.careersUrl;
      comp.discoverySource = t.category;
      for (const j of jobs) {
        comp.inlineRoles.push({
          title: j.title,
          location: j.location,
          employmentType: j.employmentType,
          applyTarget: j.applyUrl,
          techCategory: j.techCategory,
          seniorityLevel: j.seniorityLevel,
          descriptionSummary: j.descriptionSummary,
          skills: j.skills,
        });
      }
      atsJobsCount += jobs.length;
      console.log(`  ✓ ${t.name} (${t.category}): +${jobs.length} jobs`);
    }
  }

  await processAtsList(ashbyTargets, (d, n, tok) => atsHarvester.fetchAshbyJobs(d, n, tok));
  await processAtsList(greenhouseTargets, (d, n, tok) => atsHarvester.fetchGreenhouseJobs(d, n, tok));
  await processAtsList(leverTargets, (d, n, tok) => atsHarvester.fetchLeverJobs(d, n, tok));
  console.log(`  -> Accumulated ${companyMap.size} unique companies (${atsJobsCount} ATS jobs).`);

  // 3. HARVEST ESTABLISHED-REMOTE (78 companies)
  console.log("\n[3/5] Harvesting Established Remote Directory (yanirs/established-remote)...");
  try {
    const ghHarvester = new GitHubDirectoryHarvester();
    const estProfiles = await ghHarvester.harvestEstablishedRemote(100);
    console.log(`  Fetched ${estProfiles.length} profiles from established-remote.`);

    for (const p of estProfiles) {
      if (!p.domain || isGenericDomain(p.domain)) continue;
      const existing = companyMap.get(p.domain);
      if (existing) {
        if (p.careersUrl && !existing.careersUrl) existing.careersUrl = p.careersUrl;
        if (p.techStack.length > 0) existing.techStack = Array.from(new Set([...existing.techStack, ...p.techStack]));
      } else {
        companyMap.set(p.domain, {
          id: `comp_${p.domain.replace(/[^a-z0-9]/g, "_")}`,
          domain: p.domain,
          name: p.name,
          tagline: p.tagline || `Remote technology company`,
          description: p.description || `${p.name} remote engineering team.`,
          websiteUrl: p.websiteUrl,
          logoUrl: null,
          industry: p.industry || "Software & Technology",
          techStack: p.techStack,
          socialLinks: p.socialLinks,
          contactEmail: p.contactEmail ?? null,
          headcountEstimate: p.headcountEstimate || "20-100",
          locationHint: p.locationHint || "Remote / US",
          discoverySource: "established_remote",
          careersUrl: p.careersUrl ?? null,
          inlineRoles: p.inlineRoles,
        });
      }
    }
  } catch (err) {
    console.error("  Failed to harvest established-remote:", err);
  }
  console.log(`  -> Accumulated ${companyMap.size} unique companies so far.`);

  // 4. HARVEST 5 MONTHS OF HACKER NEWS THREADS (May to Sept 2026)
  console.log("\n[4/5] Harvesting 5 Months of Hacker News 'Who is Hiring' Threads (2000+ comments)...");
  try {
    const hnHarvester = new HackerNewsHarvester();
    const stories = [
      { id: "49522897", title: "September 2026" },
      { id: "49156683", title: "August 2026" },
      { id: "48747976", title: "July 2026" },
      { id: "48357725", title: "June 2026" },
      { id: "47975571", title: "May 2026" },
    ];

    let hnAdded = 0;
    let rolesAdded = 0;

    for (const s of stories) {
      console.log(`  Fetching Ask HN: Who is hiring? (${s.title})...`);
      for (let page = 0; page < 2; page++) {
        const url = `https://hn.algolia.com/api/v1/search?tags=comment,story_${s.id}&hitsPerPage=100&page=${page}`;
        const res = await fetch(url, { headers: { "User-Agent": "OffRadarJobHarvester/1.0" } });
        if (!res.ok) continue;

        const data = (await res.json()) as { hits?: any[] };
        for (const hit of data.hits || []) {
          if (!hit.comment_text || String(hit.parent_id) !== String(s.id)) continue;

          const p = hnHarvester.parseHnComment(hit);
          if (!p || !p.domain || isGenericDomain(p.domain)) continue;

          const existing = companyMap.get(p.domain);
          if (existing) {
            if (p.contactEmail && !existing.contactEmail) existing.contactEmail = p.contactEmail;
            if (p.careersUrl && !existing.careersUrl) existing.careersUrl = p.careersUrl;
            if (p.inlineRoles.length > 0) {
              existing.inlineRoles.push(...p.inlineRoles);
              rolesAdded += p.inlineRoles.length;
            }
            if (p.techStack.length > 0) {
              existing.techStack = Array.from(new Set([...existing.techStack, ...p.techStack]));
            }
          } else {
            hnAdded++;
            rolesAdded += p.inlineRoles.length;
            companyMap.set(p.domain, {
              id: `comp_${p.domain.replace(/[^a-z0-9]/g, "_")}`,
              domain: p.domain,
              name: p.name,
              tagline: p.tagline || `Hiring tech team on Hacker News (${s.title})`,
              description: p.description || `${p.name} software engineering team.`,
              websiteUrl: p.websiteUrl,
              logoUrl: null,
              industry: p.industry || "Technology",
              techStack: p.techStack,
              socialLinks: p.socialLinks,
              contactEmail: p.contactEmail ?? null,
              headcountEstimate: p.headcountEstimate || "5-50",
              locationHint: p.locationHint || "US / Remote",
              discoverySource: `hn_${s.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
              careersUrl: p.careersUrl ?? null,
              inlineRoles: p.inlineRoles,
            });
          }
        }
      }
    }
    console.log(`  Parsed ${hnAdded} new company profiles and ${rolesAdded} roles from 5 HN threads.`);

    // Targeted HN searches for Bootstrapped, YC, and Venture hiring
    console.log("  Running targeted HN searches for Bootstrapped, YC & Build In Public...");
    const targetedQueries = [
      { q: "bootstrapped hiring remote", source: "build_in_public" },
      { q: "YC hiring", source: "yc_startups" },
      { q: "build in public hiring", source: "build_in_public" },
    ];
    for (const tq of targetedQueries) {
      try {
        const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(tq.q)}&tags=comment&hitsPerPage=50`;
        const res = await fetch(url, { headers: { "User-Agent": "OffRadarJobHarvester/1.0" } });
        if (!res.ok) continue;
        const data = (await res.json()) as { hits?: any[] };
        for (const hit of data.hits || []) {
          const p = hnHarvester.parseHnComment(hit);
          if (!p || !p.domain || isGenericDomain(p.domain)) continue;
          const existing = companyMap.get(p.domain);
          if (existing) {
            if (p.inlineRoles.length > 0) existing.inlineRoles.push(...p.inlineRoles);
          } else {
            hnAdded++;
            companyMap.set(p.domain, {
              id: `comp_${p.domain.replace(/[^a-z0-9]/g, "_")}`,
              domain: p.domain,
              name: p.name,
              tagline: p.tagline || `Hiring team (${tq.source.replace(/_/g, " ")})`,
              description: p.description || `${p.name} hiring team.`,
              websiteUrl: p.websiteUrl,
              logoUrl: null,
              industry: p.industry || "Technology",
              techStack: p.techStack,
              socialLinks: p.socialLinks,
              contactEmail: p.contactEmail ?? null,
              headcountEstimate: p.headcountEstimate || "5-50",
              locationHint: p.locationHint || "US / Remote",
              discoverySource: tq.source,
              careersUrl: p.careersUrl ?? null,
              inlineRoles: p.inlineRoles,
            });
          }
        }
      } catch {}
    }
  } catch (err) {
    console.error("  Failed to harvest Hacker News:", err);
  }
  console.log(`  -> Accumulated ${companyMap.size} unique companies so far.`);

  // 5. HARVEST REMOTEINTECH (220+ companies with chunked concurrency)
  console.log("\n[5/5] Harvesting remoteintech/remote-jobs directory (220 companies)...");
  try {
    const ghHarvester = new GitHubDirectoryHarvester();
    const contentsRes = await fetch(
      "https://api.github.com/repos/remoteintech/remote-jobs/contents/src/companies",
      { headers: { "User-Agent": "OffRadarJobHarvester/1.0" } }
    );

    let remoteInTechCount = 0;
    if (contentsRes.ok) {
      const files = (await contentsRes.json()) as Array<{ name: string }>;
      const slugs = files
        .map((f) => f.name.replace(/\.md$/, ""))
        .filter((s) => s !== "README")
        .slice(0, 230);

      // Concurrent chunks of 25 for high speed
      const batchSize = 25;
      for (let i = 0; i < slugs.length; i += batchSize) {
        const batch = slugs.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (slug) => {
            try {
              const url = `https://cdn.jsdelivr.net/gh/remoteintech/remote-jobs@main/src/companies/${slug}.md`;
              const r = await fetch(url);
              if (!r.ok) return;
              const text = await r.text();
              const p = ghHarvester.parseRemoteInTechMarkdown(text);
              if (!p || !p.domain || isGenericDomain(p.domain)) return;

              remoteInTechCount++;
              const existing = companyMap.get(p.domain);
              if (existing) {
                if (p.careersUrl && !existing.careersUrl) existing.careersUrl = p.careersUrl;
                if (p.techStack.length > 0) {
                  existing.techStack = Array.from(new Set([...existing.techStack, ...p.techStack]));
                }
              } else {
                companyMap.set(p.domain, {
                  id: `comp_${p.domain.replace(/[^a-z0-9]/g, "_")}`,
                  domain: p.domain,
                  name: p.name,
                  tagline: p.tagline || `Remote engineering studio (${p.headcountEstimate})`,
                  description: p.description || `${p.name} remote software development team.`,
                  websiteUrl: p.websiteUrl,
                  logoUrl: null,
                  industry: p.industry || "Software & Services",
                  techStack: p.techStack,
                  socialLinks: p.socialLinks,
                  contactEmail: p.contactEmail ?? null,
                  headcountEstimate: p.headcountEstimate || "10-100",
                  locationHint: p.locationHint || "Remote / US",
                  discoverySource: "remoteintech",
                  careersUrl: p.careersUrl ?? null,
                  inlineRoles: p.inlineRoles,
                });
              }
            } catch {
              // ignore
            }
          })
        );
      }
      console.log(`  Parsed ${remoteInTechCount} profiles from remoteintech.`);
    }
  } catch (err) {
    console.error("  Failed to harvest remoteintech:", err);
  }

  const allCompanies = Array.from(companyMap.values());
  const totalRolesCount = allCompanies.reduce((acc, c) => acc + c.inlineRoles.length, 0);

  console.log(`\n===================================================================`);
  console.log(`📊 Ingestion Complete:`);
  console.log(`   - Unique Companies: ${allCompanies.length}`);
  console.log(`   - Direct Jobs:       ${totalRolesCount}`);
  console.log(`===================================================================\n`);

  // 6. BUILD CLEAN CHUNKED SQL STATEMENTS
  console.log("Generating chunked SQL statements for Cloudflare D1...");
  const scratchDir = path.resolve(process.cwd(), "scratch", "sql_chunks");
  if (fs.existsSync(scratchDir)) {
    fs.rmSync(scratchDir, { recursive: true, force: true });
  }
  fs.mkdirSync(scratchDir, { recursive: true });

  const allStatements: string[] = [];

  for (const c of allCompanies) {
    const techStackJson = JSON.stringify(c.techStack);
    const socialLinksJson = JSON.stringify(c.socialLinks);

    // 6A. Companies
    allStatements.push(
      `INSERT INTO companies (
        id, domain, name, tagline, description, website_url, logo_url, industry,
        tech_stack, social_links, contact_email, headcount_estimate, location_hint,
        discovery_source, created_at, updated_at
      ) VALUES (
        ${escapeSql(c.id)},
        ${escapeSql(c.domain)},
        ${escapeSql(c.name)},
        ${escapeSql(c.tagline)},
        ${escapeSql(c.description)},
        ${escapeSql(c.websiteUrl)},
        ${escapeSql(c.logoUrl)},
        ${escapeSql(c.industry)},
        ${escapeSql(techStackJson)},
        ${escapeSql(socialLinksJson)},
        ${escapeSql(c.contactEmail)},
        ${escapeSql(c.headcountEstimate)},
        ${escapeSql(c.locationHint)},
        ${escapeSql(c.discoverySource)},
        ${now},
        ${now}
      ) ON CONFLICT(domain) DO UPDATE SET
        name = excluded.name,
        tagline = COALESCE(excluded.tagline, companies.tagline),
        description = COALESCE(excluded.description, companies.description),
        website_url = excluded.website_url,
        tech_stack = excluded.tech_stack,
        contact_email = COALESCE(excluded.contact_email, companies.contact_email),
        headcount_estimate = COALESCE(excluded.headcount_estimate, companies.headcount_estimate),
        location_hint = COALESCE(excluded.location_hint, companies.location_hint),
        updated_at = ${now};`
    );

    // 6B. Career Pages (foreign-key safe via SELECT c.id)
    const pageUrl = c.careersUrl || `${c.websiteUrl.replace(/\/$/, "")}/careers`;
    const pageId = `page_${c.id}_auto`;
    allStatements.push(
      `INSERT OR IGNORE INTO career_pages (
        id, company_id, url, page_type, status, content_hash, last_checked_at, created_at
      )
      SELECT
        ${escapeSql(pageId)},
        c.id,
        ${escapeSql(pageUrl)},
        'custom',
        'active',
        NULL,
        ${now},
        ${now}
      FROM companies c
      WHERE c.domain = ${escapeSql(c.domain)}
      LIMIT 1;`
    );

    // 6C. Jobs (foreign-key safe via SELECT c.id, cp.id)
    for (const r of c.inlineRoles) {
      const title = r.title.trim();
      const contentHash = hashString(`${c.domain}_${title.toLowerCase()}_${r.applyTarget || ""}`);
      const jobId = `job_${c.id.substring(0, 14)}_${contentHash.substring(0, 12)}`;
      const seniority = r.seniorityLevel || inferSeniority(title);
      const techCategory = r.techCategory || inferTechCategory(title, r.skills || c.techStack);
      const applyTarget = r.applyTarget || c.careersUrl || c.contactEmail || c.websiteUrl;
      const applyType = applyTarget.includes("@") ? "email" : "url";
      const descSummary = r.descriptionSummary || `${c.name} is hiring a ${title} (${c.locationHint || "Remote"}).`;

      allStatements.push(
        `INSERT INTO jobs (
          id, company_id, career_page_id, title, department, employment_type,
          location, is_remote, remote_scope, salary_min, salary_max, salary_currency,
          skills, description_summary, raw_content, apply_type, apply_target,
          status, content_hash, first_seen_at, last_seen_at, seniority_level,
          tech_category, is_tech_role
        )
        SELECT
          ${escapeSql(jobId)},
          c.id,
          cp.id,
          ${escapeSql(title)},
          'Engineering',
          ${escapeSql(r.employmentType || "full-time")},
          ${escapeSql(r.location || c.locationHint || "Remote")},
          1,
          'worldwide',
          NULL,
          NULL,
          'USD',
          ${escapeSql(JSON.stringify(r.skills || c.techStack))},
          ${escapeSql(descSummary)},
          NULL,
          ${escapeSql(applyType)},
          ${escapeSql(applyTarget)},
          'open',
          ${escapeSql(contentHash)},
          ${now},
          ${now},
          ${escapeSql(seniority)},
          ${escapeSql(techCategory)},
          1
        FROM companies c
        JOIN career_pages cp ON cp.company_id = c.id
        WHERE c.domain = ${escapeSql(c.domain)}
        LIMIT 1
        ON CONFLICT(content_hash) DO UPDATE SET
          title = excluded.title,
          seniority_level = excluded.seniority_level,
          tech_category = excluded.tech_category,
          apply_target = excluded.apply_target,
          last_seen_at = ${now},
          status = 'open';`
      );
    }
  }

  // Chunking by 250 operations per file for reliable D1 batching
  const CHUNK_SIZE = 250;
  const chunkFiles: string[] = [];

  for (let i = 0; i < allStatements.length; i += CHUNK_SIZE) {
    const chunkStatements = allStatements.slice(i, i + CHUNK_SIZE);
    const chunkSql = [
      "PRAGMA foreign_keys = OFF;",
      ...chunkStatements,
      "PRAGMA foreign_keys = ON;",
    ].join("\n\n");

    const chunkIndex = String(Math.floor(i / CHUNK_SIZE) + 1).padStart(3, "0");
    const chunkPath = path.join(scratchDir, `chunk_${chunkIndex}.sql`);
    fs.writeFileSync(chunkPath, chunkSql, "utf-8");
    chunkFiles.push(chunkPath);
  }

  console.log(`\n💾 Generated ${chunkFiles.length} chunk files (Total: ${allStatements.length} operations) in scratch/sql_chunks/`);
}

main().catch((err) => {
  console.error("Fatal error during comprehensive update:", err);
  process.exit(1);
});
