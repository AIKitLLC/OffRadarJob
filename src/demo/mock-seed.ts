/**
 * Mock Seed Websites & Realistic HTML Fixtures for testing and demoing
 * Represents real-world patterns used by micro-companies (1-10 people) who do not post on LinkedIn/Indeed.
 */

export interface MockSiteFixture {
  domain: string;
  url: string;
  homepageHtml: string;
  careerPages: Record<string, string>;
}

export const MOCK_FIXTURES: MockSiteFixture[] = [
  {
    domain: "tinysaas.dev",
    url: "https://tinysaas.dev",
    homepageHtml: `<!DOCTYPE html>
<html>
<head>
  <title>TinySaaS — Observability for SQLite & Edge DBs</title>
  <meta property="og:site_name" content="TinySaaS" />
  <meta property="og:title" content="Fast, lightweight SQLite observability" />
  <meta name="description" content="Bootstrapped micro-SaaS built by a team of 3 developers. We help developers monitor edge databases." />
  <link rel="icon" href="/assets/icon.png" />
  <script src="/_next/static/chunks/main.js"></script>
</head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/features">Features</a>
    <a href="/careers">We're Hiring (1)</a>
  </nav>
  <h1>TinySaaS — The developer tool for Edge SQLite</h1>
  <p>Proudly bootstrapped, profitable, and 100% remote-first since day one.</p>
  <footer>
    <a href="https://twitter.com/tinysaas_dev">Twitter / X</a>
    <a href="https://github.com/tinysaas">GitHub</a>
    <p>Contact: <a href="mailto:founders@tinysaas.dev">founders@tinysaas.dev</a></p>
  </footer>
</body>
</html>`,
    careerPages: {
      "https://tinysaas.dev/careers": `<!DOCTYPE html>
<html>
<head>
  <title>Careers at TinySaaS — Open Positions</title>
</head>
<body>
  <h1>Join our small team of 3</h1>
  <p>We are hiring! All roles are worldwide remote, async-first.</p>
  
  <article class="job-card">
    <h3>Senior Rust & TypeScript Systems Engineer</h3>
    <p>Help us scale our Edge SQLite telemetry agent written in Rust and Cloudflare Workers.</p>
    <p>Location: 100% Remote (Worldwide)</p>
    <p>Type: Full-time</p>
    <p>Compensation: $110,000 - $140,000 USD + profit sharing</p>
    <p>Stack: Rust, TypeScript, Cloudflare, SQLite, React</p>
    <p>How to apply: Send your GitHub profile and previous work to <a href="mailto:careers@tinysaas.dev?subject=Senior%20Rust%20Engineer">careers@tinysaas.dev</a>.</p>
  </article>

  <article class="job-card">
    <h3>Part-time Developer Advocate (DevRel)</h3>
    <p>Write technical articles, sample apps, and documentation for our developer community.</p>
    <p>Location: Remote (Asia / Europe friendly)</p>
    <p>Type: Part-time</p>
    <p>Compensation: $3,000 - $5,000 USD / month</p>
    <p>Stack: Python, Next.js, Technical Writing</p>
    <p>How to apply: Email us at <a href="mailto:careers@tinysaas.dev?subject=DevRel">careers@tinysaas.dev</a>.</p>
  </article>
</body>
</html>`
    }
  },
  {
    domain: "boutiquelab.vn",
    url: "https://boutiquelab.vn",
    homepageHtml: `<!DOCTYPE html>
<html>
<head>
  <title>Boutique Lab Saigon — High-performance Web & AI Studio</title>
  <meta property="og:site_name" content="Boutique Lab" />
  <meta name="description" content="A 6-person boutique engineering studio based in Saigon, Vietnam. We craft bespoke AI products and web platforms." />
</head>
<body>
  <header>
    <h1>Boutique Lab Saigon</h1>
    <a href="/join">Work With Us</a>
  </header>
  <p>We build exceptional digital experiences for global clients.</p>
  <footer>
    <a href="https://linkedin.com/company/boutiquelab-vn">LinkedIn</a>
    <a href="https://github.com/boutiquelab">GitHub</a>
    <a href="mailto:team@boutiquelab.vn">team@boutiquelab.vn</a>
  </footer>
</body>
</html>`,
    careerPages: {
      "https://boutiquelab.vn/join": `<!DOCTYPE html>
<html>
<head><title>Work With Us — Boutique Lab</title></head>
<body>
  <h2>Open Positions at Boutique Lab</h2>
  <p>We are a tight-knit boutique studio of 6 engineers and designers. We value craftsmanship over growth hacking.</p>

  <div class="job-item">
    <h3>Founding Full-Stack AI Engineer</h3>
    <p>Build LLM agents, streaming APIs, and interactive UI for our US & Singapore clients.</p>
    <p>Location: Saigon / Remote (Vietnam)</p>
    <p>Salary: $40,000 - $60,000 USD (or equivalent VND)</p>
    <p>Requirements: TypeScript, Python, Tailwind, PyTorch or LLM APIs, Postgres</p>
    <p>Apply: Send email with CV or demo projects to <a href="mailto:founder@boutiquelab.vn?subject=FullStackAI">founder@boutiquelab.vn</a>.</p>
  </div>
</body>
</html>`
    }
  },
  {
    domain: "solomaker.tools",
    url: "https://solomaker.tools",
    homepageHtml: `<!DOCTYPE html>
<html>
<head>
  <title>SoloMaker Tools — Micro developer utilities</title>
  <meta name="description" content="Indie hacker project with 2 micro SaaS tools. Built by a solo founder." />
</head>
<body>
  <h1>SoloMaker Tools</h1>
  <p>Looking for someone to help with design & frontend on contract.</p>
  <p>Check out our <a href="https://solomaker.notion.site/open-contract-roles">Notion Career Board</a>.</p>
  <footer>
    <a href="https://x.com/solomaker">Twitter</a>
    <a href="mailto:hi@solomaker.tools">hi@solomaker.tools</a>
  </footer>
</body>
</html>`,
    careerPages: {
      "https://solomaker.notion.site/open-contract-roles": `<!DOCTYPE html>
<html>
<head><title>Notion — Open Contract Roles</title></head>
<body>
  <h2>Freelance UI/UX Product Designer</h2>
  <p>We need a contract designer to redesign our core web app dashboards.</p>
  <p>Type: Contract</p>
  <p>Location: Anywhere / Worldwide Remote</p>
  <p>Compensation: $4,000 - $7,000 USD per milestone</p>
  <p>Skills: Figma, UI/UX, Design Systems, Tailwind</p>
  <p>Submit portfolio via form: <a href="https://solomaker.tools/apply-form">https://solomaker.tools/apply-form</a></p>
</body>
</html>`
    }
  }
];

export const REAL_WORLD_SEEDS = [
  "https://tinysaas.dev",
  "https://boutiquelab.vn",
  "https://solomaker.tools",
];
