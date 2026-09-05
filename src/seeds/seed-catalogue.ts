/**
 * Curated Seed Catalogue of Small & Medium Companies (SMBs) & Boutique Tech Studios in the US
 * Comprehensive coverage across 5 US geographic ecosystems:
 * 1. US-Midwest Hubs (Chicago, Minneapolis, Indianapolis, Columbus, Ann Arbor, Madison, Kansas City)
 * 2. Texas & Southwest / Mountain Hubs (Austin, Dallas, Denver, Boulder, Salt Lake City, Phoenix)
 * 3. East Coast & Mid-Atlantic Hubs (New York City, Boston, Philadelphia, Raleigh-Durham NC)
 * 4. West Coast & Pacific Northwest Hubs (Seattle, Portland, SF Bay Area boutique studios)
 * 5. US Boutique AI / ML, Systems & Micro-SaaS Labs
 */

export interface SeedTarget {
  url: string;
  name: string;
  region: string;
  category:
    | "midwest_boutique"
    | "texas_southwest"
    | "east_coast"
    | "west_coast"
    | "ai_ml"
    | "systems_infra"
    | "micro_saas"
    | "community_feed";
  headcount?: string;
  notes?: string;
}

export const CURATED_SEEDS: SeedTarget[] = [
  // ===========================================================================
  // 1. US-MIDWEST REGION (Chicago, Minneapolis, Indianapolis, Ann Arbor, Madison, Cincinnati, Columbus, KC)
  // ===========================================================================
  { url: "https://37signals.com", name: "37signals", region: "Chicago, IL", category: "midwest_boutique", headcount: "50-70", notes: "Creators of Basecamp, Hey, and Ruby on Rails. Boutique remote team." },
  { url: "https://basecamp.com", name: "Basecamp", region: "Chicago, IL", category: "midwest_boutique", headcount: "50-70" },
  { url: "https://promptloop.com", name: "PromptLoop", region: "Chicago, IL", category: "midwest_boutique", headcount: "1-10", notes: "Micro AI data web scraping & Excel automation startup" },
  { url: "https://sixfeetup.com", name: "Six Feet Up", region: "Carmel, IN", category: "midwest_boutique", headcount: "20-50", notes: "Boutique Python, Django, AWS & Cloud consultancies" },
  { url: "https://bendyworks.com", name: "Bendyworks", region: "Madison, WI", category: "midwest_boutique", headcount: "10-25", notes: "Craftsman software agency specializing in Elixir, Ruby, React" },
  { url: "https://softwareforgood.com", name: "Software for Good", region: "Minneapolis, MN", category: "midwest_boutique", headcount: "15-30", notes: "Mission-driven boutique engineering studio" },
  { url: "https://gaslight.co", name: "Gaslight", region: "Cincinnati, OH", category: "midwest_boutique", headcount: "15-30", notes: "Boutique dev consultancy building Ruby, Elixir & React products" },
  { url: "https://atomicobject.com", name: "Atomic Object", region: "Ann Arbor / Grand Rapids, MI", category: "midwest_boutique", headcount: "50-100", notes: "Custom software design & dev consultancy" },
  { url: "https://crema.us", name: "Crema", region: "Kansas City, MO", category: "midwest_boutique", headcount: "20-45", notes: "Digital product agency & venture studio" },
  { url: "https://tablexi.com", name: "Table XI", region: "Chicago, IL", category: "midwest_boutique", headcount: "30-60", notes: "Custom software studio (Elixir, Ruby, Python, React)" },
  { url: "https://testdouble.com", name: "Test Double", region: "Columbus, OH", category: "midwest_boutique", headcount: "50-90", notes: "Engineering consultancy dedicated to software craft" },
  { url: "https://nerdery.com", name: "Nerdery", region: "Minneapolis, MN", category: "midwest_boutique", headcount: "100-200", notes: "Midwest digital consultancy & systems development" },
  { url: "https://spinweb.com", name: "SpinWeb", region: "Indianapolis, IN", category: "midwest_boutique", headcount: "10-25" },
  { url: "https://infinitemachines.co", name: "Infinite Machines", region: "Chicago, IL", category: "midwest_boutique", headcount: "5-20" },
  { url: "https://cloverleaf.me", name: "Cloverleaf", region: "Cincinnati, OH", category: "midwest_boutique", headcount: "15-35", notes: "Micro-SaaS automated coaching platform" },
  { url: "https://radialdevelopment.com", name: "Radial Development", region: "Indianapolis, IN", category: "midwest_boutique", headcount: "10-25" },
  { url: "https://headway.io", name: "Headway", region: "Green Bay, WI", category: "midwest_boutique", headcount: "20-40", notes: "Digital product innovation studio" },
  { url: "https://hologram.io", name: "Hologram", region: "Chicago, IL", category: "midwest_boutique", headcount: "50-100", notes: "Global cellular platform for IoT devices" },
  { url: "https://kin.com", name: "Kin Insurance", region: "Chicago, IL", category: "midwest_boutique", headcount: "100-250", notes: "Direct-to-consumer home insurance tech" },
  { url: "https://joinroot.com", name: "Root Insurance", region: "Columbus, OH", category: "midwest_boutique", headcount: "150-300", notes: "Mobile-first telematics insurtech" },
  { url: "https://showpad.com", name: "Showpad", region: "Chicago, IL", category: "midwest_boutique", headcount: "150-300", notes: "Sales enablement tech platform" },
  { url: "https://upcity.com", name: "UpCity", region: "Chicago, IL", category: "midwest_boutique", headcount: "30-60", notes: "B2B service provider marketplace" },
  { url: "https://braviantholdings.com", name: "Braviant Holdings", region: "Chicago, IL", category: "midwest_boutique", headcount: "50-120", notes: "Next-gen fintech lending analytics" },
  { url: "https://leveltenenergy.com", name: "LevelTen Energy", region: "Midwest / Remote", category: "midwest_boutique", headcount: "40-80", notes: "Renewable energy marketplace software" },

  // ===========================================================================
  // 2. TEXAS & SOUTHWEST / MOUNTAIN REGION (Austin, Dallas, Denver, Boulder, Salt Lake City)
  // ===========================================================================
  { url: "https://modernize.com", name: "Modernize Home Services", region: "Austin, TX", category: "texas_southwest", headcount: "50-150", notes: "Home improvement digital marketplace" },
  { url: "https://flosports.tv", name: "FloSports", region: "Austin, TX", category: "texas_southwest", headcount: "150-300", notes: "Direct-to-consumer sports streaming network" },
  { url: "https://liquibase.org", name: "Liquibase", region: "Austin, TX", category: "texas_southwest", headcount: "40-80", notes: "Open source database change management tooling" },
  { url: "https://junglescout.com", name: "Jungle Scout", region: "Austin, TX", category: "texas_southwest", headcount: "100-200", notes: "All-in-one platform for e-commerce sellers" },
  { url: "https://aceable.com", name: "Aceable", region: "Austin, TX", category: "texas_southwest", headcount: "50-120", notes: "Mobile education & certification platform" },
  { url: "https://zenoss.com", name: "Zenoss", region: "Austin, TX", category: "texas_southwest", headcount: "80-150", notes: "Full-stack monitoring and AIOps software" },
  { url: "https://automox.com", name: "Automox", region: "Boulder, CO", category: "texas_southwest", headcount: "100-200", notes: "Cloud-native cyber hygiene and patch automation" },
  { url: "https://jumpcloud.com", name: "JumpCloud", region: "Louisville, CO", category: "texas_southwest", headcount: "150-300", notes: "Cloud directory and identity access platform" },
  { url: "https://sovrn.com", name: "Sovrn", region: "Boulder, CO", category: "texas_southwest", headcount: "100-200", notes: "Publishing monetization tools and audience data" },
  { url: "https://formstack.com", name: "Formstack", region: "Colorado / Remote", category: "texas_southwest", headcount: "100-250", notes: "Workplace productivity and forms workflow SaaS" },
  { url: "https://guild.com", name: "Guild Education", region: "Denver, CO", category: "texas_southwest", headcount: "200-400", notes: "Workforce education and upskilling platform" },
  { url: "https://route.com", name: "Route", region: "Lehi, UT", category: "texas_southwest", headcount: "150-300", notes: "Post-purchase package tracking and protection" },
  { url: "https://podium.com", name: "Podium", region: "Lehi, UT", category: "texas_southwest", headcount: "200-450", notes: "Customer communication platform for local businesses" },
  { url: "https://lucid.co", name: "Lucid Software", region: "South Jordan, UT", category: "texas_southwest", headcount: "250-500", notes: "Makers of Lucidchart and Lucidspark collaboration" },
  { url: "https://canopytax.com", name: "Canopy", region: "Lehi, UT", category: "texas_southwest", headcount: "50-120", notes: "Practice management software for tax professionals" },
  { url: "https://pattern.com", name: "Pattern", region: "Salt Lake City, UT", category: "texas_southwest", headcount: "150-350", notes: "Ecommerce acceleration platform and marketplace tech" },

  // ===========================================================================
  // 3. EAST COAST & MID-ATLANTIC (New York City, Boston, Philadelphia, Raleigh-Durham NC)
  // ===========================================================================
  { url: "https://thoughtbot.com", name: "Thoughtbot", region: "Boston, MA", category: "east_coast", headcount: "50-100", notes: "Boutique design & development consultancy, creators of Paperclip & FactoryBot" },
  { url: "https://viget.com", name: "Viget", region: "Falls Church, VA / Durham, NC", category: "east_coast", headcount: "40-80", notes: "Digital product agency & craft development studio" },
  { url: "https://alley.com", name: "Alley Interactive", region: "New York, NY", category: "east_coast", headcount: "50-100", notes: "Engineering agency for media publishers & nonprofits" },
  { url: "https://dockyard.com", name: "DockYard", region: "Boston, MA", category: "east_coast", headcount: "30-60", notes: "Digital product studio specializing in Elixir, Ember, React" },
  { url: "https://carbonfive.com", name: "Carbon Five", region: "New York, NY / SF", category: "east_coast", headcount: "40-80", notes: "Agile software development consultancy for growing teams" },
  { url: "https://postlight.com", name: "Postlight", region: "New York, NY", category: "east_coast", headcount: "60-120", notes: "Digital strategy, product, and platform engineering studio" },
  { url: "https://willowtreeapps.com", name: "WillowTree", region: "Charlottesville, VA / Durham, NC", category: "east_coast", headcount: "200-500", notes: "Mobile and digital product engineering agency" },
  { url: "https://formlabs.com", name: "Formlabs", region: "Somerville, MA", category: "east_coast", headcount: "200-500", notes: "3D printing hardware & software systems" },
  { url: "https://datacamp.com", name: "DataCamp", region: "New York, NY", category: "east_coast", headcount: "150-300", notes: "Interactive data science & AI learning platform" },
  { url: "https://policygenius.com", name: "Policygenius", region: "New York, NY", category: "east_coast", headcount: "150-350", notes: "Online insurance marketplace and fintech software" },
  { url: "https://betterment.com", name: "Betterment", region: "New York, NY", category: "east_coast", headcount: "200-400", notes: "Automated investing and financial advisory technology" },
  { url: "https://seatgeek.com", name: "SeatGeek", region: "New York, NY", category: "east_coast", headcount: "200-450", notes: "Mobile-focused ticket platform and stadium software" },
  { url: "https://pendo.io", name: "Pendo", region: "Raleigh, NC", category: "east_coast", headcount: "200-450", notes: "Product experience, digital adoption, and user telemetry" },
  { url: "https://bandwidth.com", name: "Bandwidth", region: "Raleigh, NC", category: "east_coast", headcount: "200-400", notes: "Enterprise cloud communications and messaging APIs" },
  { url: "https://spreedly.com", name: "Spreedly", region: "Durham, NC", category: "east_coast", headcount: "50-120", notes: "Universal payment orchestration gateway" },

  // ===========================================================================
  // 4. WEST COAST & PACIFIC NORTHWEST (Seattle, Portland, Bay Area Boutique Studios)
  // ===========================================================================
  { url: "https://panic.com", name: "Panic", region: "Portland, OR", category: "west_coast", headcount: "25-35", notes: "Makers of Nova, Transmit, Prompt, and the Playdate handheld" },
  { url: "https://metalab.com", name: "MetaLab", region: "Seattle / Remote", category: "west_coast", headcount: "80-150", notes: "Boutique product studio that built early Slack, Uber, Pitch" },
  { url: "https://substantial.com", name: "Substantial", region: "Seattle, WA", category: "west_coast", headcount: "20-50", notes: "Digital product studio building custom software & AI apps" },
  { url: "https://outreach.io", name: "Outreach", region: "Seattle, WA", category: "west_coast", headcount: "250-500", notes: "Sales execution and intelligence software platform" },
  { url: "https://highspot.com", name: "Highspot", region: "Seattle, WA", category: "west_coast", headcount: "250-500", notes: "Sales enablement platform with AI guidance" },
  { url: "https://duckduckgo.com", name: "DuckDuckGo", region: "Remote US / Paoli, PA", category: "west_coast", headcount: "100-200", notes: "Privacy products: search, browser, tracker blocking" },
  { url: "https://linear.app", name: "Linear", region: "San Francisco, CA / Remote", category: "west_coast", headcount: "30-60", notes: "High-craft issue tracker for high-performing engineering teams" },
  { url: "https://resend.com", name: "Resend", region: "San Francisco, CA / Remote", category: "west_coast", headcount: "5-15", notes: "Email API for developers, craft-focused small team" },
  { url: "https://mintlify.com", name: "Mintlify", region: "San Francisco, CA", category: "west_coast", headcount: "10-25", notes: "Modern developer documentation platform" },
  { url: "https://loops.so", name: "Loops", region: "San Francisco, CA", category: "west_coast", headcount: "5-15", notes: "Email marketing built specifically for modern SaaS" },
  { url: "https://dub.co", name: "Dub", region: "San Francisco, CA / Remote", category: "west_coast", headcount: "3-10", notes: "Open-source link management platform, lean team" },
  { url: "https://clerk.com", name: "Clerk", region: "San Francisco, CA", category: "west_coast", headcount: "25-50", notes: "User authentication & management built for React/Next.js" },
  { url: "https://raycast.com", name: "Raycast", region: "Remote US", category: "west_coast", headcount: "15-35", notes: "Blazingly fast extensible desktop launcher for developers" },

  // ===========================================================================
  // 5. US BOUTIQUE AI/ML, CLOUD SYSTEMS & MICRO-SAAS
  // ===========================================================================
  { url: "https://modal.com", name: "Modal Labs", region: "New York / SF / Remote", category: "ai_ml", headcount: "15-30", notes: "Run generative AI, batch jobs, and GPU workloads" },
  { url: "https://replicate.com", name: "Replicate", region: "San Francisco, CA", category: "ai_ml", headcount: "25-50", notes: "Run open-source machine learning models with a cloud API" },
  { url: "https://together.ai", name: "Together AI", region: "San Francisco, CA", category: "ai_ml", headcount: "40-90", notes: "Decentralized cloud for AI model training and inference" },
  { url: "https://groq.com", name: "Groq", region: "Mountain View, CA", category: "ai_ml", headcount: "100-200", notes: "Ultra fast LPU inference engine for real-time LLMs" },
  { url: "https://cursor.com", name: "Cursor / Anysphere", region: "San Francisco, CA", category: "ai_ml", headcount: "10-25", notes: "AI-first code editor, boutique high-performance engineering" },
  { url: "https://braintrustdata.com", name: "Braintrust", region: "San Francisco, CA", category: "ai_ml", headcount: "10-25", notes: "Enterprise evaluations & logging for LLM apps" },
  { url: "https://langfuse.com", name: "Langfuse", region: "Remote US", category: "ai_ml", headcount: "5-15", notes: "Open source LLM observability" },
  { url: "https://fly.io", name: "Fly.io", region: "Chicago / SF / Remote", category: "systems_infra", headcount: "30-60", notes: "Public cloud for apps close to users, founded in Chicago" },
  { url: "https://railway.app", name: "Railway", region: "San Francisco, CA / Remote", category: "systems_infra", headcount: "15-30", notes: "Instant infrastructure platform, lean engineering team" },
  { url: "https://render.com", name: "Render", region: "San Francisco, CA", category: "systems_infra", headcount: "40-80", notes: "Unified cloud to build and run all your apps and websites" },
  { url: "https://supabase.com", name: "Supabase", region: "Remote US", category: "systems_infra", headcount: "60-120", notes: "Open source Firebase alternative built on PostgreSQL" },
  { url: "https://neon.tech", name: "Neon", region: "Remote US", category: "systems_infra", headcount: "40-80", notes: "Serverless Postgres with branching" },
  { url: "https://planetscale.com", name: "PlanetScale", region: "Mountain View, CA", category: "systems_infra", headcount: "50-100", notes: "Serverless MySQL platform powered by Vitess" },
  { url: "https://turso.tech", name: "Turso / ChiselStrike", region: "Remote US", category: "systems_infra", headcount: "15-30", notes: "SQLite for the Edge powered by libSQL" },
  { url: "https://depot.dev", name: "Depot", region: "San Francisco, CA", category: "systems_infra", headcount: "5-15", notes: "Fast remote container builds" },
  { url: "https://tailscale.com", name: "Tailscale", region: "Toronto / Remote US", category: "systems_infra", headcount: "80-150", notes: "Zero-config mesh VPN based on WireGuard" },
  { url: "https://transistor.fm", name: "Transistor", region: "Remote US", category: "micro_saas", headcount: "4", notes: "Podcast hosting for independent creators, team of 4" },
  { url: "https://fathom-analytics.com", name: "Fathom Analytics", region: "Remote US", category: "micro_saas", headcount: "5", notes: "Privacy-focused website analytics, team of 5" },
  { url: "https://cal.com", name: "Cal.com", region: "Remote US", category: "micro_saas", headcount: "15-30", notes: "Open source scheduling infrastructure" },
  { url: "https://posthog.com", name: "PostHog", region: "Remote US", category: "micro_saas", headcount: "40-80", notes: "All-in-one product analytics suite" },
  { url: "https://trigger.dev", name: "Trigger.dev", region: "Remote US", category: "micro_saas", headcount: "5-15", notes: "Background jobs framework for TypeScript" },
  { url: "https://inngest.com", name: "Inngest", region: "Remote US", category: "micro_saas", headcount: "10-25", notes: "Event-driven durable execution engine" }
];

export function getCuratedSeedUrls(): string[] {
  return CURATED_SEEDS.map((s) => s.url);
}

export function getSeedsByRegion(regionKeyword: string): string[] {
  const kw = regionKeyword.toLowerCase();
  return CURATED_SEEDS
    .filter((s) => s.region.toLowerCase().includes(kw) || s.category.toLowerCase().includes(kw))
    .map((s) => s.url);
}

export function getSeedsByCategory(category: SeedTarget["category"]): SeedTarget[] {
  return CURATED_SEEDS.filter((s) => s.category === category);
}
