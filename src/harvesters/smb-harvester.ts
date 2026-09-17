/**
 * Cross-Industry US SMB Harvester & Scheduled Gathering Pipeline
 * Covers 41 vetted Small & Medium Businesses across 9 non-tech & tech-enabled US industries.
 */

import { AtsHarvester, AtsJobPosting } from "./ats-harvester.js";
import { ID1Database } from "../db/types.js";
import crypto from "node:crypto";

export interface SmbTarget {
  id: string;
  name: string;
  domain: string;
  websiteUrl: string;
  atsType: "ashby" | "greenhouse" | "lever";
  atsToken: string;
  industry: string;
  industryGroup:
    | "healthcare_biotech"
    | "cleantech_energy"
    | "manufacturing_robotics"
    | "fintech_insurtech"
    | "logistics_proptech"
    | "retail_ecommerce"
    | "foodtech_agriculture"
    | "edtech_legaltech"
    | "hrtech_smb_ops";
  headcount: string;
  locationHint: string;
  tagline: string;
  description: string;
}

export const SMB_CATALOGUE: SmbTarget[] = [
  // ===========================================================================
  // 1. HEALTHCARE, BIOTECH & LIFE SCIENCES (Y tế, Dược phẩm & Công nghệ sinh học)
  // ===========================================================================
  {
    id: "comp_headway_co",
    name: "Headway",
    domain: "headway.co",
    websiteUrl: "https://headway.co",
    atsType: "ashby",
    atsToken: "headway",
    industry: "Healthcare & Mental Health",
    industryGroup: "healthcare_biotech",
    headcount: "200-450",
    locationHint: "New York, NY / Remote",
    tagline: "Building a new mental healthcare system everyone can access.",
    description: "Headway connects patients with therapists who accept insurance, removing financial and logistical barriers to mental health.",
  },
  {
    id: "comp_benchling_com",
    name: "Benchling",
    domain: "benchling.com",
    websiteUrl: "https://benchling.com",
    atsType: "ashby",
    atsToken: "benchling",
    industry: "Biotech & Life Sciences Cloud",
    industryGroup: "healthcare_biotech",
    headcount: "300-600",
    locationHint: "San Francisco, CA / Remote",
    tagline: "The cloud platform accelerating modern life science R&D.",
    description: "Benchling provides digital notebooks, molecular biology tools, and scientific data management for biotech companies.",
  },
  {
    id: "comp_mavenclinic_com",
    name: "Maven Clinic",
    domain: "mavenclinic.com",
    websiteUrl: "https://mavenclinic.com",
    atsType: "greenhouse",
    atsToken: "mavenclinic",
    industry: "Digital Healthcare & Women's Health",
    industryGroup: "healthcare_biotech",
    headcount: "250-500",
    locationHint: "New York, NY / Remote",
    tagline: "The largest virtual clinic for women's and family health.",
    description: "Maven delivers continuous virtual clinical support across fertility, pregnancy, postpartum, and parenting.",
  },
  {
    id: "comp_ro_co",
    name: "Ro",
    domain: "ro.co",
    websiteUrl: "https://ro.co",
    atsType: "lever",
    atsToken: "ro",
    industry: "Telehealth & Personalized Medicine",
    industryGroup: "healthcare_biotech",
    headcount: "250-500",
    locationHint: "New York, NY / Remote",
    tagline: "Direct-to-patient healthcare technology platform.",
    description: "Ro seamlessly connects telehealth consultations, diagnostics, and at-home medication delivery.",
  },
  {
    id: "comp_komodohealth_com",
    name: "Komodo Health",
    domain: "komodohealth.com",
    websiteUrl: "https://komodohealth.com",
    atsType: "greenhouse",
    atsToken: "komodohealth",
    industry: "Healthcare Data & Analytics",
    industryGroup: "healthcare_biotech",
    headcount: "300-600",
    locationHint: "New York, NY / San Francisco, CA",
    tagline: "Mapping disease and closing gaps in patient care.",
    description: "Komodo creates the Healthcare Map, linking clinical insights to accelerate novel therapies and disease treatment.",
  },
  {
    id: "comp_modernhealth_com",
    name: "Modern Health",
    domain: "modernhealth.com",
    websiteUrl: "https://modernhealth.com",
    atsType: "greenhouse",
    atsToken: "modernhealth",
    industry: "Workplace Mental Health",
    industryGroup: "healthcare_biotech",
    headcount: "150-350",
    locationHint: "San Francisco, CA / Remote",
    tagline: "Comprehensive enterprise mental wellness and personalized therapy.",
    description: "Modern Health combines digital programs, coaching, and clinical therapy to improve mental health for global workforces.",
  },
  {
    id: "comp_cedar_com",
    name: "Cedar",
    domain: "cedar.com",
    websiteUrl: "https://cedar.com",
    atsType: "ashby",
    atsToken: "cedar",
    industry: "Healthcare Financial Engagement",
    industryGroup: "healthcare_biotech",
    headcount: "200-400",
    locationHint: "New York, NY / Remote",
    tagline: "Making healthcare billing clear, transparent, and manageable.",
    description: "Cedar provides patient financial engagement platforms for leading healthcare providers and hospital networks.",
  },

  // ===========================================================================
  // 2. CLEANTECH, CLIMATE & SUSTAINABILITY (Năng lượng sạch, Khí hậu & Lưu trữ)
  // ===========================================================================
  {
    id: "comp_crusoe_ai",
    name: "Crusoe Energy",
    domain: "crusoe.ai",
    websiteUrl: "https://crusoe.ai",
    atsType: "ashby",
    atsToken: "crusoe",
    industry: "Climate Compute & Clean Power",
    industryGroup: "cleantech_energy",
    headcount: "300-600",
    locationHint: "Denver, CO / San Francisco, CA",
    tagline: "Pioneering climate-aligned compute powered by stranded & renewable energy.",
    description: "Crusoe harnesses stranded energy and flare gas to power high-performance computing data centers with net zero carbon impact.",
  },
  {
    id: "comp_formenergy_com",
    name: "Form Energy",
    domain: "formenergy.com",
    websiteUrl: "https://formenergy.com",
    atsType: "ashby",
    atsToken: "formenergy",
    industry: "Grid Storage & Clean Energy",
    industryGroup: "cleantech_energy",
    headcount: "350-700",
    locationHint: "Somerville, MA / Weirton, WV",
    tagline: "Multi-day iron-air energy storage for a 100% renewable power grid.",
    description: "Form Energy designs low-cost, multi-day battery storage to make renewable solar and wind power dispatchable around the clock.",
  },
  {
    id: "comp_arcadia_com",
    name: "Arcadia",
    domain: "arcadia.com",
    websiteUrl: "https://arcadia.com",
    atsType: "lever",
    atsToken: "arcadia",
    industry: "Climate Data & Energy Platform",
    industryGroup: "cleantech_energy",
    headcount: "200-400",
    locationHint: "Washington, DC / Remote",
    tagline: "Unlocking utility data to accelerate zero-carbon energy transitions.",
    description: "Arcadia operates the Arc platform, providing programmatic access to global energy and carbon accounting data.",
  },
  {
    id: "comp_watershed_com",
    name: "Watershed",
    domain: "watershed.com",
    websiteUrl: "https://watershed.com",
    atsType: "greenhouse",
    atsToken: "watershed",
    industry: "Enterprise Carbon Accounting",
    industryGroup: "cleantech_energy",
    headcount: "150-350",
    locationHint: "San Francisco, CA / London / Remote",
    tagline: "The enterprise climate platform for measuring and cutting emissions.",
    description: "Watershed helps leading global corporations measure, report, and reduce their supply chain carbon footprint.",
  },
  {
    id: "comp_leveltenenergy_com",
    name: "LevelTen Energy",
    domain: "leveltenenergy.com",
    websiteUrl: "https://leveltenenergy.com",
    atsType: "greenhouse",
    atsToken: "leveltenenergy",
    industry: "Renewable Energy Marketplace",
    industryGroup: "cleantech_energy",
    headcount: "50-120",
    locationHint: "Seattle, WA / Remote",
    tagline: "Transaction infrastructure for clean energy power purchase agreements.",
    description: "LevelTen connects clean energy developers and corporate buyers to facilitate renewable energy contracts.",
  },
  {
    id: "comp_amperon_co",
    name: "Amperon",
    domain: "amperon.co",
    websiteUrl: "https://amperon.co",
    atsType: "greenhouse",
    atsToken: "amperon",
    industry: "AI Grid Demand Forecasting",
    industryGroup: "cleantech_energy",
    headcount: "40-90",
    locationHint: "Houston, TX / Remote",
    tagline: "AI-powered electricity demand forecasting for grid stability.",
    description: "Amperon provides sub-hourly electricity forecasting and risk management tools to utilities and energy traders.",
  },

  // ===========================================================================
  // 3. MANUFACTURING, HARDWARE & ROBOTICS (Sản xuất, Phần cứng & Robotics)
  // ===========================================================================
  {
    id: "comp_formlabs_com",
    name: "Formlabs",
    domain: "formlabs.com",
    websiteUrl: "https://formlabs.com",
    atsType: "greenhouse",
    atsToken: "formlabs",
    industry: "Advanced 3D Printing & Hardware",
    industryGroup: "manufacturing_robotics",
    headcount: "350-700",
    locationHint: "Somerville, MA / Remote",
    tagline: "Accessible, industrial-grade stereolithography and SLS 3D printing.",
    description: "Formlabs builds precision 3D printers, engineering materials, and factory automation software used by designers and manufacturers worldwide.",
  },
  {
    id: "comp_nuro_ai",
    name: "Nuro",
    domain: "nuro.ai",
    websiteUrl: "https://nuro.ai",
    atsType: "greenhouse",
    atsToken: "nuro",
    industry: "Autonomous Robotics & Delivery",
    industryGroup: "manufacturing_robotics",
    headcount: "400-800",
    locationHint: "Mountain View, CA / Houston, TX",
    tagline: "Custom autonomous electric vehicles transforming local commerce.",
    description: "Nuro engineers purpose-built autonomous delivery vehicles designed to move goods safely, quickly, and affordably.",
  },
  {
    id: "comp_standardbots_com",
    name: "Standard Bots",
    domain: "standardbots.com",
    websiteUrl: "https://standardbots.com",
    atsType: "ashby",
    atsToken: "standardbots",
    industry: "Industrial Robotics & Automation",
    industryGroup: "manufacturing_robotics",
    headcount: "40-100",
    locationHint: "Glen Cove, NY / Remote",
    tagline: "Affordable, AI-powered collaborative robotic arms for small factories.",
    description: "Standard Bots builds high-precision robotic arms equipped with computer vision to automate manufacturing for SMBs.",
  },
  {
    id: "comp_markforged_com",
    name: "Markforged",
    domain: "markforged.com",
    websiteUrl: "https://markforged.com",
    atsType: "greenhouse",
    atsToken: "markforged",
    industry: "Industrial Additive Manufacturing",
    industryGroup: "manufacturing_robotics",
    headcount: "250-500",
    locationHint: "Waltham, MA",
    tagline: "Industrial 3D printers producing metal and continuous fiber composite parts.",
    description: "The Digital Forge platform enables manufacturers to replace machined metal parts with lightweight composite 3D printed components.",
  },

  // ===========================================================================
  // 4. FINTECH & INSURTECH (Công nghệ Tài chính & Bảo hiểm)
  // ===========================================================================
  {
    id: "comp_ramp_com",
    name: "Ramp",
    domain: "ramp.com",
    websiteUrl: "https://ramp.com",
    atsType: "ashby",
    atsToken: "ramp",
    industry: "Corporate Spend & Finance Automation",
    industryGroup: "fintech_insurtech",
    headcount: "400-800",
    locationHint: "New York, NY / Miami / Remote",
    tagline: "The financial operations platform designed to help companies spend less.",
    description: "Ramp combines corporate cards, automated expense management, bill pay, and procurement into an unified operating platform.",
  },
  {
    id: "comp_carta_com",
    name: "Carta",
    domain: "carta.com",
    websiteUrl: "https://carta.com",
    atsType: "greenhouse",
    atsToken: "carta",
    industry: "Equity Management & Fund Admin",
    industryGroup: "fintech_insurtech",
    headcount: "400-800",
    locationHint: "San Francisco, CA / New York / Remote",
    tagline: "Building the ownership infrastructure for modern private companies.",
    description: "Carta automates cap table management, 409A valuations, and venture capital fund administration.",
  },
  {
    id: "comp_novacredit_com",
    name: "Nova Credit",
    domain: "novacredit.com",
    websiteUrl: "https://novacredit.com",
    atsType: "greenhouse",
    atsToken: "novacredit",
    industry: "Cross-Border Credit Infrastructure",
    industryGroup: "fintech_insurtech",
    headcount: "60-150",
    locationHint: "New York, NY / San Francisco / Remote",
    tagline: "Cross-border credit bureau data bridging global financial mobility.",
    description: "Nova Credit enables newcomers and immigrants to translate their international credit history to US financial institutions.",
  },
  {
    id: "comp_moderntreasury_com",
    name: "Modern Treasury",
    domain: "moderntreasury.com",
    websiteUrl: "https://moderntreasury.com",
    atsType: "ashby",
    atsToken: "moderntreasury",
    industry: "Payment Operations & Treasury APIs",
    industryGroup: "fintech_insurtech",
    headcount: "100-250",
    locationHint: "San Francisco, CA / Remote",
    tagline: "APIs and ledger software for programmatic money movement.",
    description: "Modern Treasury builds payment infrastructure connecting corporate finance teams directly to banking rails.",
  },
  {
    id: "comp_unit_co",
    name: "Unit",
    domain: "unit.co",
    websiteUrl: "https://unit.co",
    atsType: "ashby",
    atsToken: "unit",
    industry: "Banking-as-a-Service",
    industryGroup: "fintech_insurtech",
    headcount: "50-120",
    locationHint: "New York, NY / San Francisco / Remote",
    tagline: "Banking-as-a-Service platform enabling apps to embed financial accounts and cards.",
    description: "Unit empowers tech companies and SMBs to embed checking accounts, credit cards, and loans into their existing products.",
  },

  // ===========================================================================
  // 5. SUPPLY CHAIN, LOGISTICS & PROPTECH (Chuỗi cung ứng, Logistics & Bất động sản)
  // ===========================================================================
  {
    id: "comp_samsara_com",
    name: "Samsara",
    domain: "samsara.com",
    websiteUrl: "https://samsara.com",
    atsType: "greenhouse",
    atsToken: "samsara",
    industry: "Industrial IoT & Fleet Telematics",
    industryGroup: "logistics_proptech",
    headcount: "500-1000",
    locationHint: "San Francisco, CA / Atlanta / Remote",
    tagline: "The Connected Operations Cloud for fleet safety, maintenance, and asset tracking.",
    description: "Samsara equips vehicle fleets, construction equipment, and industrial sites with AI cameras, telematics, and sensors.",
  },
  {
    id: "comp_flexport_com",
    name: "Flexport",
    domain: "flexport.com",
    websiteUrl: "https://flexport.com",
    atsType: "greenhouse",
    atsToken: "flexport",
    industry: "Global Logistics & Freight Forwarding",
    industryGroup: "logistics_proptech",
    headcount: "500-1000",
    locationHint: "San Francisco, CA / Chicago / Remote",
    tagline: "Tech-driven freight forwarding and global trade operating system.",
    description: "Flexport provides end-to-end ocean, air, and truck freight logistics with automated customs clearance and real-time container tracking.",
  },
  {
    id: "comp_qualia_com",
    name: "Qualia",
    domain: "qualia.com",
    websiteUrl: "https://qualia.com",
    atsType: "greenhouse",
    atsToken: "qualia",
    industry: "Real Estate Title & Escrow Infrastructure",
    industryGroup: "logistics_proptech",
    headcount: "200-450",
    locationHint: "Austin, TX / San Francisco / Remote",
    tagline: "Digital closing platform orchestrating real estate transactions.",
    description: "Qualia connects title agents, realtors, lenders, and homebuyers to securely execute residential and commercial property closings.",
  },
  {
    id: "comp_vts_com",
    name: "VTS",
    domain: "vts.com",
    websiteUrl: "https://vts.com",
    atsType: "greenhouse",
    atsToken: "vts",
    industry: "Commercial Real Estate Tech",
    industryGroup: "logistics_proptech",
    headcount: "250-500",
    locationHint: "New York, NY / Remote",
    tagline: "Leasing and asset management platform for commercial landlords.",
    description: "VTS provides real-time market data, leasing workflows, and tenant experience apps for commercial office and retail properties.",
  },
  {
    id: "comp_kargo_com",
    name: "Kargo",
    domain: "kargo.com",
    websiteUrl: "https://kargo.com",
    atsType: "greenhouse",
    atsToken: "kargo",
    industry: "Smart Supply Chain Sensors",
    industryGroup: "logistics_proptech",
    headcount: "50-150",
    locationHint: "San Francisco, CA / Remote",
    tagline: "Automated freight verification towers for warehouse loading docks.",
    description: "Kargo deploys intelligent camera towers at warehouse dock doors to verify freight, scan barcodes, and prevent shipping errors.",
  },
  {
    id: "comp_openspace_ai",
    name: "OpenSpace",
    domain: "openspace.ai",
    websiteUrl: "https://openspace.ai",
    atsType: "greenhouse",
    atsToken: "openspace",
    industry: "Construction AI & 360 Jobsite Capture",
    industryGroup: "logistics_proptech",
    headcount: "150-300",
    locationHint: "San Francisco, CA / Remote",
    tagline: "Automated 360-degree video jobsite mapping and computer vision for builders.",
    description: "OpenSpace enables construction superintendents to walk jobsites with a 360 camera, automatically pinning photos to building floor plans.",
  },

  // ===========================================================================
  // 6. RETAIL, E-COMMERCE & CONSUMER BRANDS (Bán lẻ & Thương mại điện tử)
  // ===========================================================================
  {
    id: "comp_pattern_com",
    name: "Pattern",
    domain: "pattern.com",
    websiteUrl: "https://pattern.com",
    atsType: "lever",
    atsToken: "pattern",
    industry: "E-Commerce Acceleration & Marketplaces",
    industryGroup: "retail_ecommerce",
    headcount: "300-700",
    locationHint: "Salt Lake City, UT / Remote",
    tagline: "Accelerating global brand sales across Amazon, Walmart, and international channels.",
    description: "Pattern provides proprietary algorithmic pricing, advertising optimization, and logistics for consumer brands.",
  },
  {
    id: "comp_faire_com",
    name: "Faire",
    domain: "faire.com",
    websiteUrl: "https://faire.com",
    atsType: "greenhouse",
    atsToken: "faire",
    industry: "B2B Wholesale Marketplace",
    industryGroup: "retail_ecommerce",
    headcount: "400-800",
    locationHint: "San Francisco, CA / Salt Lake City / Remote",
    tagline: "Wholesale marketplace empowering independent retail boutique shops.",
    description: "Faire connects hundreds of thousands of independent neighborhood retailers with boutique makers and emerging brands.",
  },
  {
    id: "comp_glossier_com",
    name: "Glossier",
    domain: "glossier.com",
    websiteUrl: "https://glossier.com",
    atsType: "greenhouse",
    atsToken: "glossier",
    industry: "Direct-to-Consumer Beauty & Wellness",
    industryGroup: "retail_ecommerce",
    headcount: "200-450",
    locationHint: "New York, NY / Remote",
    tagline: "Pioneering community-driven skincare and beauty brand.",
    description: "Glossier creates beauty and skincare essentials inspired by personal style and individual expression.",
  },

  // ===========================================================================
  // 7. FOODTECH, RESTAURANT SYSTEMS & AGRICULTURE (Công nghệ Thực phẩm & Nhà hàng)
  // ===========================================================================
  {
    id: "comp_toasttab_com",
    name: "Toast",
    domain: "toasttab.com",
    websiteUrl: "https://toasttab.com",
    atsType: "greenhouse",
    atsToken: "toast",
    industry: "Restaurant Cloud POS & Management",
    industryGroup: "foodtech_agriculture",
    headcount: "500-1500",
    locationHint: "Boston, MA / Chicago / Remote",
    tagline: "All-in-one restaurant platform powering kitchens, dining rooms, and mobile ordering.",
    description: "Toast builds hardware terminals, kitchen display systems, and online ordering software for restaurants of all sizes.",
  },
  {
    id: "comp_sweetgreen_com",
    name: "Sweetgreen",
    domain: "sweetgreen.com",
    websiteUrl: "https://sweetgreen.com",
    atsType: "greenhouse",
    atsToken: "sweetgreen",
    industry: "Tech-Enabled Healthy Food & Automation",
    industryGroup: "foodtech_agriculture",
    headcount: "400-900",
    locationHint: "Los Angeles, CA / New York / Remote",
    tagline: "Connecting people to real food with automated kitchen robotic bowls.",
    description: "Sweetgreen combines scratch-cooked farm-fresh meals, mobile apps, and automated robotic Infinite Kitchen technology.",
  },
  {
    id: "comp_chownow_com",
    name: "ChowNow",
    domain: "chownow.com",
    websiteUrl: "https://chownow.com",
    atsType: "lever",
    atsToken: "chownow",
    industry: "Commission-Free Restaurant Ordering",
    industryGroup: "foodtech_agriculture",
    headcount: "150-350",
    locationHint: "Los Angeles, CA / Remote",
    tagline: "Helping independent neighborhood restaurants compete online without predatory fees.",
    description: "ChowNow powers branded mobile apps and online takeout ordering systems directly on local restaurants' websites.",
  },

  // ===========================================================================
  // 8. EDTECH & LEGALTECH (Công nghệ Giáo dục & Công nghệ Pháp lý)
  // ===========================================================================
  {
    id: "comp_duolingo_com",
    name: "Duolingo",
    domain: "duolingo.com",
    websiteUrl: "https://duolingo.com",
    atsType: "greenhouse",
    atsToken: "duolingo",
    industry: "Mobile Language & Math Learning",
    industryGroup: "edtech_legaltech",
    headcount: "400-800",
    locationHint: "Pittsburgh, PA / New York / Seattle",
    tagline: "Free, fun, and effective science-backed mobile education for everyone.",
    description: "Duolingo creates gamified learning apps for languages, literacy, and math used by over 80 million active monthly learners.",
  },
  {
    id: "comp_everlaw_com",
    name: "Everlaw",
    domain: "everlaw.com",
    websiteUrl: "https://everlaw.com",
    atsType: "greenhouse",
    atsToken: "everlaw",
    industry: "Cloud Litigation & Legal eDiscovery",
    industryGroup: "edtech_legaltech",
    headcount: "200-450",
    locationHint: "Oakland, CA / Remote",
    tagline: "Collaborative discovery and investigation platform for law firms and corporate legal teams.",
    description: "Everlaw uses machine learning and high-speed document indexing to illuminate evidence in complex legal investigations.",
  },
  {
    id: "comp_coursera_org",
    name: "Coursera",
    domain: "coursera.org",
    websiteUrl: "https://coursera.org",
    atsType: "greenhouse",
    atsToken: "coursera",
    industry: "Online University Degrees & Professional Skills",
    industryGroup: "edtech_legaltech",
    headcount: "400-900",
    locationHint: "Mountain View, CA / Remote",
    tagline: "Universal access to world-class learning from leading universities and companies.",
    description: "Coursera partners with over 300 universities and institutions to offer courses, certificates, and accredited online degree programs.",
  },
  {
    id: "comp_outschool_com",
    name: "Outschool",
    domain: "outschool.com",
    websiteUrl: "https://outschool.com",
    atsType: "greenhouse",
    atsToken: "outschool",
    industry: "K-12 Small-Group Live Learning",
    industryGroup: "edtech_legaltech",
    headcount: "80-180",
    locationHint: "San Francisco, CA / Remote",
    tagline: "Live online classes and collaborative community learning for kids.",
    description: "Outschool offers interactive small-group live video classes taught by independent passionate teachers across STEM, arts, and languages.",
  },

  // ===========================================================================
  // 9. HRTECH & SMALL BUSINESS OPERATIONS (Nhân sự & Vận hành Doanh nghiệp)
  // ===========================================================================
  {
    id: "comp_gusto_com",
    name: "Gusto",
    domain: "gusto.com",
    websiteUrl: "https://gusto.com",
    atsType: "greenhouse",
    atsToken: "gusto",
    industry: "Payroll, Benefits & SMB HR",
    industryGroup: "hrtech_smb_ops",
    headcount: "400-900",
    locationHint: "Denver, CO / San Francisco / Remote",
    tagline: "All-in-one payroll, health insurance, and HR platform serving 300,000+ businesses.",
    description: "Gusto automates payroll tax filings, direct deposits, health benefits, and time tracking for growing small businesses.",
  },
  {
    id: "comp_justworks_com",
    name: "Justworks",
    domain: "justworks.com",
    websiteUrl: "https://justworks.com",
    atsType: "greenhouse",
    atsToken: "justworks",
    industry: "PEO, HR & Healthcare Benefits for SMBs",
    industryGroup: "hrtech_smb_ops",
    headcount: "400-850",
    locationHint: "New York, NY / Remote",
    tagline: "Taking the pain out of payroll, benefits, and HR compliance for entrepreneurial teams.",
    description: "Justworks serves as a certified Professional Employer Organization (PEO), giving small companies access to enterprise-grade healthcare rates.",
  },
  {
    id: "comp_lattice_com",
    name: "Lattice",
    domain: "lattice.com",
    websiteUrl: "https://lattice.com",
    atsType: "greenhouse",
    atsToken: "lattice",
    industry: "People Success, Reviews & OKRs",
    industryGroup: "hrtech_smb_ops",
    headcount: "250-500",
    locationHint: "San Francisco, CA / New York / Remote",
    tagline: "People management software connecting performance reviews, goals, and employee engagement.",
    description: "Lattice enables HR leaders and managers to run 360 feedback reviews, career progression ladders, and pulse surveys.",
  },
];

export interface GatherResult {
  totalTargets: number;
  successfulTargets: number;
  totalJobsGathered: number;
  byIndustry: Record<string, number>;
  jobsByTarget: Record<string, AtsJobPosting[]>;
}

export class SmbHarvester {
  private atsHarvester: AtsHarvester;

  constructor() {
    this.atsHarvester = new AtsHarvester();
  }

  /**
   * Harvest open positions for a single SMB target
   */
  public async fetchTargetJobs(target: SmbTarget): Promise<AtsJobPosting[]> {
    if (target.atsType === "ashby") {
      return await this.atsHarvester.fetchAshbyJobs(target.domain, target.name, target.atsToken);
    } else if (target.atsType === "greenhouse") {
      return await this.atsHarvester.fetchGreenhouseJobs(target.domain, target.name, target.atsToken);
    } else if (target.atsType === "lever") {
      return await this.atsHarvester.fetchLeverJobs(target.domain, target.name, target.atsToken);
    }
    return [];
  }

  /**
   * Gather jobs concurrently across all SMB targets
   */
  public async gatherAll(targets: SmbTarget[] = SMB_CATALOGUE, concurrency: number = 6): Promise<GatherResult> {
    const jobsByTarget: Record<string, AtsJobPosting[]> = {};
    const byIndustry: Record<string, number> = {};
    let totalJobsGathered = 0;
    let successfulTargets = 0;

    for (let i = 0; i < targets.length; i += concurrency) {
      const batch = targets.slice(i, i + concurrency);
      await Promise.all(
        batch.map(async (target) => {
          try {
            const jobs = await this.fetchTargetJobs(target);
            jobsByTarget[target.id] = jobs;
            if (jobs.length > 0) {
              successfulTargets++;
              totalJobsGathered += jobs.length;
              byIndustry[target.industry] = (byIndustry[target.industry] || 0) + jobs.length;
            }
          } catch (err) {
            console.error(`[SmbHarvester] Failed to harvest ${target.name}:`, err);
            jobsByTarget[target.id] = [];
          }
        })
      );
    }

    return {
      totalTargets: targets.length,
      successfulTargets,
      totalJobsGathered,
      byIndustry,
      jobsByTarget,
    };
  }

  /**
   * Helper to escape SQL strings safely
   */
  public escapeSql(str: string | null | undefined): string {
    if (str === null || str === undefined) return "NULL";
    return `'${String(str).replace(/'/g, "''")}'`;
  }

  /**
   * Generate foreign-key safe SQL statements for companies, career pages, and jobs
   */
  public generateStatements(
    targets: SmbTarget[],
    jobsByTarget: Record<string, AtsJobPosting[]>
  ): {
    companySqls: string[];
    careerPageSqls: string[];
    jobSqls: string[];
  } {
    const now = Date.now();
    const companySqls: string[] = [];
    const careerPageSqls: string[] = [];
    const jobSqls: string[] = [];

    for (const target of targets) {
      const jobs = jobsByTarget[target.id] || [];
      const careerUrl =
        target.atsType === "greenhouse"
          ? `https://boards.greenhouse.io/${target.atsToken}`
          : target.atsType === "ashby"
          ? `https://jobs.ashbyhq.com/${target.atsToken}`
          : `https://jobs.lever.co/${target.atsToken}`;

      companySqls.push(`
        INSERT INTO companies (
          id, domain, name, tagline, description, website_url,
          logo_url, industry, tech_stack, social_links, contact_email,
          headcount_estimate, location_hint, discovery_source,
          created_at, updated_at
        ) VALUES (
          ${this.escapeSql(target.id)},
          ${this.escapeSql(target.domain)},
          ${this.escapeSql(target.name)},
          ${this.escapeSql(target.tagline)},
          ${this.escapeSql(target.description)},
          ${this.escapeSql(target.websiteUrl)},
          NULL,
          ${this.escapeSql(target.industry)},
          '["Cross-Industry","SMB","US"]',
          '{}',
          NULL,
          ${this.escapeSql(target.headcount)},
          ${this.escapeSql(target.locationHint)},
          'smb_scheduler',
          ${now},
          ${now}
        ) ON CONFLICT(domain) DO UPDATE SET
          industry = excluded.industry,
          headcount_estimate = COALESCE(companies.headcount_estimate, excluded.headcount_estimate),
          location_hint = COALESCE(companies.location_hint, excluded.location_hint),
          updated_at = ${now};
      `.trim());

      const pageId = `page_smb_${target.domain.replace(/[^a-zA-Z0-9]/g, "_")}`;
      careerPageSqls.push(`
        INSERT OR IGNORE INTO career_pages (
          id, company_id, url, status, page_type, content_hash, last_checked_at, created_at
        ) SELECT
          ${this.escapeSql(pageId)},
          c.id,
          ${this.escapeSql(careerUrl)},
          'active',
          ${this.escapeSql(target.atsType)},
          NULL,
          ${now},
          ${now}
        FROM companies c WHERE c.domain = ${this.escapeSql(target.domain)};
      `.trim());

      for (const j of jobs) {
        const hashInput = `${target.domain}|${j.title}|${j.applyUrl}`;
        const contentHash = crypto.createHash("sha256").update(hashInput).digest("hex").substring(0, 32);
        const jobId = `job_smb_${contentHash.substring(0, 16)}`;

        jobSqls.push(`
          INSERT INTO jobs (
            id, company_id, career_page_id, title, department,
            employment_type, location, is_remote, remote_scope,
            salary_min, salary_max, salary_currency, skills,
            description_summary, raw_content, apply_type, apply_target,
            status, content_hash, first_seen_at, last_seen_at,
            seniority_level, tech_category, is_tech_role
          ) SELECT
            ${this.escapeSql(jobId)},
            c.id,
            cp.id,
            ${this.escapeSql(j.title)},
            ${this.escapeSql(j.department || "Operations")},
            ${this.escapeSql(j.employmentType)},
            ${this.escapeSql(j.location)},
            ${j.isRemote ? 1 : 0},
            'US',
            NULL, NULL, 'USD',
            ${this.escapeSql(JSON.stringify(j.skills || []))},
            ${this.escapeSql(j.descriptionSummary || `${target.name} is hiring for ${j.title}`)},
            NULL,
            'url',
            ${this.escapeSql(j.applyUrl)},
            'open',
            ${this.escapeSql(contentHash)},
            ${now},
            ${now},
            ${this.escapeSql(j.seniorityLevel || "mid")},
            ${this.escapeSql(j.techCategory || "fullstack")},
            1
          FROM companies c
          JOIN career_pages cp ON cp.company_id = c.id
          WHERE c.domain = ${this.escapeSql(target.domain)}
          ON CONFLICT(content_hash) DO UPDATE SET
            last_seen_at = ${now},
            status = 'open';
        `.trim());
      }
    }

    return { companySqls, careerPageSqls, jobSqls };
  }

  /**
   * Direct D1 Database execution for Cloudflare Worker runtime
   */
  public async syncWithDatabase(db: ID1Database, targets: SmbTarget[] = SMB_CATALOGUE): Promise<{ jobsAdded: number; companiesUpdated: number }> {
    const gatherResult = await this.gatherAll(targets, 4);
    const { companySqls, careerPageSqls, jobSqls } = this.generateStatements(targets, gatherResult.jobsByTarget);

    const allSqls = [...companySqls, ...careerPageSqls, ...jobSqls];
    const batchSize = 50;

    for (let i = 0; i < allSqls.length; i += batchSize) {
      const chunk = allSqls.slice(i, i + batchSize);
      if (typeof db.batch === "function") {
        const batchStatements = chunk.map((sql) => db.prepare(sql));
        await db.batch(batchStatements).catch((err) => {
          console.error(`[SmbHarvester] Batch D1 execution error at chunk ${i}:`, err);
        });
      } else {
        for (const sql of chunk) {
          await db.prepare(sql).run().catch((err) => {
            console.error(`[SmbHarvester] Single D1 execution error:`, err);
          });
        }
      }
    }

    return {
      jobsAdded: gatherResult.totalJobsGathered,
      companiesUpdated: targets.length,
    };
  }
}
