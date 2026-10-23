# OffRadarJob (Off-Radar Job Gatherer) 🚀

[![Live Production](https://img.shields.io/badge/Production-jobs.ai--kit.net-10b981.svg?style=flat&logo=cloudflare)](https://jobs.ai-kit.net)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020.svg)](https://workers.cloudflare.com/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare-D1-F38020.svg)](https://developers.cloudflare.com/d1/)
[![Workers AI](https://img.shields.io/badge/Cloudflare-Workers%20AI-orange.svg)](https://developers.cloudflare.com/workers-ai/)
[![Model Context Protocol](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)

> **Decoupled, edge-native agent pipeline for harvesting, reranking, and optimizing applications for hidden tech jobs at high-potential micro-companies, startups, and US-Midwest tech hubs.**

---

## 🌐 Live Production Site

The platform is deployed live on Cloudflare's global edge network:
- **🚀 Main Production Portal**: [https://jobs.ai-kit.net](https://jobs.ai-kit.net)
- **⚡ Edge Worker Fallback**: [https://off-radar-jobs.tuannx87.workers.dev](https://off-radar-jobs.tuannx87.workers.dev)
- **🤖 Telegram Bot**: [@OffRadarJobBot](https://t.me/OffRadarJobBot)

---

## 📖 Overview

Standard job boards are saturated with ghost jobs, recruiter spam, and massive enterprise listings. **OffRadarJob** discovers off-the-beaten-path tech roles directly from primary sources: micro-company career pages, early-stage pitch sites, Y Combinator startup directories, GitHub repositories, and local regional tech ecosystems.

Built natively on the **Cloudflare Serverless Stack** (Workers, D1 SQLite, Queues, Vectorize, and Workers AI), OffRadarJob runs 24/7 with minimal latency, low edge resource costs, and zero external database maintenance.

---

## ✨ Key Capabilities

### 1. ⚡ Continuous JD Reranking & Real-Time Intelligence
Instead of static listings, job descriptions (JDs) are continuously evaluated and reranked via multi-factor heuristics:
- **Demand Score (35%)**: Real-time weighting of high-leverage skills (Workers AI, MCP, TypeScript, Rust, Distributed Systems).
- **Freshness Score (25%)**: Aggressive decay curves to favor newly posted roles over stale listings.
- **Transparency Score (20%)**: Rewards explicit salary ranges and direct un-gated application links.
- **Employer Credibility (20%)**: Valuation estimates, verified funding stages (Seed, Bootstrapped, Series A/B), and tech stack maturity.
- **Real-Time Pulse Report**: Dynamic telemetry aggregating trending skills, market breakdowns, and category momentum.

### 2. 🧠 Cloudflare Decision API for Multi-Version CV Optimization
Tailors candidate CVs to match specific job archetypes and target employer groups using Cloudflare Workers AI (`@cf/meta/llama-3.3-70b-instruct` / `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b`) with deterministic edge fallback:
- **Actionable Additions (Thêm)**: Highlights relevant technical achievements, quantifiable metrics, and edge/distributed systems terminology aligned with the target group.
- **Strategic Removals (Bớt)**: Eliminates outdated legacy technologies (jQuery, SVN, PHP 5), fluffy corporate buzzwords ("team player", "synergy"), and misaligned project noise.
- **Multiple Target Group Profiles**: Generates specialized CV versions for:
  - 🤖 **AI-First Innovators** (`ai_first_innovators`): LLMs, autonomous agents, MCP tools, vector search.
  - 📈 **High-Growth Scale-Ups** (`scaleups_growth`): High concurrency, microservices, Kubernetes, Kafka, reliability.
  - 🌱 **Early-Stage Startups** (`early_stage_startups`): 0-to-1 velocity, full-stack versatility, product iteration.
  - 📍 **US-Midwest Regional Tech** (`midwest_regional`): Regional ecosystems across IL, OH, MI, IN, MN, WI, etc.
  - 🎓 **New Grad & Early Career** (`new_grad_junior`): Strong fundamentals, internship impact, fast learning.
  - 🌍 **Remote-First Boutiques** (`remote_first_boutique`): Asynchronous communication, documentation rigor.

### 3. 🔌 Native Model Context Protocol (MCP) Server
OffRadarJob exposes standard MCP tools for AI IDEs (Claude Desktop, Antigravity, Cursor):
- `get_realtime_jd_ranking_report`: Retrieve live market intelligence and top-ranked JDs.
- `optimize_cv_with_decision_api`: Run Cloudflare Decision API to generate CV recommendations (add/remove) and save optimized versions.
- `list_target_groups`: Inspect available target groups and tailoring guidelines.
- `search_off_radar_jobs`: Search and filter curated openings.
- `get_daily_digest`: Fetch personalized candidate digests.
- `manage_job_subscription`: Subscribe to alert channels with regional/tech preferences.

### 4. 📱 Dynamic Telegram Bot & Personal Auth
- Fast interactive commands (`/jobs`, `/newgrad`, `/midwest`, `/cv`, `/status`).
- One-time magic login tokens generating private bearer tokens for MCP integrations.
- Role-based administration dashboard (`/admin`) for crawler controls.

---

## 🛠️ Tech Stack & Architecture

```
                      ┌──────────────────────────────────────┐
                      │    Primary Sources / Web Scrapers    │
                      │  (YC, GitHub, Micro-Companies, SMB)  │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │    Decoupled Harvester Agents       │
                      │  (Seed, CareerHunter, JobExtractor)  │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │    Cloudflare D1 & Queues Pipeline   │
                      └─────────────┬──────────────────┬─────┘
                                    │                  │
                Continuous Rerank   │                  │  CV Optimization
                                    ▼                  ▼
             ┌─────────────────────────────┐   ┌─────────────────────────────┐
             │    JdRerankerService        │   │    DecisionApiService       │
             │  - Composite Scoring        │   │  - Cloudflare Workers AI    │
             │  - Real-time Reports        │   │  - Additions & Removals     │
             │  - Target Group Fits        │   │  - Multi-version CVs        │
             └──────────────┬──────────────┘   └──────────────┬──────────────┘
                            │                                 │
                            └────────────────┬────────────────┘
                                             ▼
             ┌───────────────────────────────────────────────────────────────┐
             │       Web UI Dashboard & REST API & MCP Server Engine         │
             └───────────────────────────────────────────────────────────────┘
```

- **Runtime**: Cloudflare Workers (Edge V8)
- **Database**: Cloudflare D1 (SQLite at the edge)
- **AI Inference**: Cloudflare Workers AI (`@cf/meta/llama-3.3-70b-instruct`)
- **Queue & Storage**: Cloudflare Queues, Vectorize
- **Language**: TypeScript (Strict Mode, `exactOptionalPropertyTypes: true`)
- **Test Framework**: Vitest (23 files, 257 automated unit, integration, and red-team tests)

---

## Candidate profiles and continuous filters

A profile is CV text or structured fields: skills, seniority, locations, remote preference (`required`, `preferred`, `any`), and sponsorship preference (`required`, `not_needed`, `any`). Matching is deterministic. Each open job gets a 0–100 score and a reason for skills, seniority, location, remote, and visa-sponsorship wording. Design notes are in [docs/adr/0001-cv-job-matching.md](docs/adr/0001-cv-job-matching.md), [docs/adr/0002-job-quality-decision.md](docs/adr/0002-job-quality-decision.md), and [docs/adr/0003-continuous-new-match-filters.md](docs/adr/0003-continuous-new-match-filters.md).

Apply the storage migration before use:

```bash
npx wrangler d1 execute DB --local --file=migrations/0016_candidate_profiles_quality_and_match_alerts.sql
```

Authenticate with the user API token (`Authorization: Bearer orp_...`), then save a profile and a filter. The sample below is synthetic.

```bash
curl -X POST "$ORIGIN/api/user/candidate-profiles" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Edge platform profile",
    "text": "Jordan Hale\nSenior Software Engineer\nLocation: Chicago, IL\nOpen to remote.\nRequires visa sponsorship.\nSkills: TypeScript, Cloudflare Workers, PostgreSQL, React"
  }'

curl -X POST "$ORIGIN/api/user/job-filters" \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profileId": "PROFILE_ID",
    "keywords": ["TypeScript"],
    "seniorityLevels": ["senior"],
    "locations": ["Chicago"],
    "remote": "preferred",
    "sponsorship": "required",
    "minScore": 70
  }'
```

`POST /api/match` with `{ "profileId": "..." }` or `{ "profile": { "text": "..." } }` returns the ranked jobs and reasons. `POST /api/user/match-alerts/scan` runs the saved filters against recent open jobs and returns only new alerts. Repeating the scan does not create a second alert for the same profile, job, and content hash. `GET /api/user/match-alerts` lists them.

Gathered jobs are also classified on the extract queue and the daily cron. Rules drop spam, duplicates, and stale postings, keep complete postings, and enrich sparse skill lists from the posting text. A Workers AI judge (`@cf/meta/llama-3.1-8b-instruct`, temperature 0) runs only for the review band, and the decision is stored in `job_quality_decisions`. `POST /api/admin/quality/run` runs a bounded pass with the admin token. MCP tools: `rank_jobs_for_profile`, `save_candidate_profile`, `save_job_filter`, `list_new_match_alerts`.

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare Account (for production deployment)

### Installation
```bash
git clone https://github.com/AIKitLLC/OffRadarJob.git
cd OffRadarJob
npm install
```

### Database Initialization
Run the initial schema and migrations locally:
```bash
# Execute initial schema
npm run cf-db:init

# Apply subsequent migrations
for file in migrations/*.sql; do
  npx wrangler d1 execute DB --local --file="$file"
done
```

### Running Locally & Deployment
```bash
# Start local development server
npm run dev
# Open http://localhost:8787

# Deploy to Cloudflare Production (https://jobs.ai-kit.net)
npm run deploy
```

### Testing & Type Checking
```bash
# Run full Vitest suite (257 tests across 23 test files)
npm test

# Verify strict TypeScript types
npm run typecheck
```

### Continuous integration

Pull requests run `npm ci`, `npm run typecheck`, and `npm test`. A failure fails the workflow.

A push to `main`, or a manual run of the CI workflow from `main`, repeats those checks, applies remote D1 migrations (`wrangler d1 migrations apply off_radar_db --remote`), then runs `npm run deploy`. Migrations run first. A migration failure stops the deploy. The deploy job uses the GitHub Environment `production` and a concurrency group of the same name, so production deploys do not overlap. Manual runs from any other branch run the checks only.

Store these Actions secrets on the `production` environment. Do not commit the values.

| Secret | Role |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Authenticates Wrangler. |
| `CLOUDFLARE_ACCOUNT_ID` | Account that owns the Worker and D1 database. Wrangler uses `account_id` from `wrangler.jsonc` when that field is set, and the workflow stops unless this secret is the same account. |

Create the token for that account only. This Wrangler config needs these permissions:

- **Account → Workers Scripts → Edit** — deploy the Worker, cron triggers, the Durable Object migration, and the Workers AI, KV, and queue-producer bindings.
- **Account → D1 → Edit** — apply migrations to the remote `off_radar_db` database.
- **Account → Queues → Edit** — confirm the configured queues exist and create or update their consumers, including the dead-letter queue setting.
- **Zone → Workers Routes → Edit** — publish the custom domain in `wrangler.jsonc`. Scope this to that zone.

Workers AI, KV, and Durable Objects are attached as bindings on the script upload, so they do not add token permissions. The queues named in `wrangler.jsonc` must already exist.

Before the first deploy from `main`, confirm the remote database's `d1_migrations` history matches `migrations/`. Schema that was loaded with `wrangler d1 execute` is not recorded there, and the first apply will fail closed instead of deploying. `wrangler deploy` keeps Worker secrets and replaces plain-text vars with the `vars` in `wrangler.jsonc`. In non-interactive CI it also republishes the custom domain and overwrites a conflicting DNS record for that hostname.

---

## 🤖 Contributing & Agent Guidelines

Autonomous coding agents and human contributors are welcome!

### Golden Rule for Agents: Check for Duplicates First
Before creating any GitHub issue, bug report, or feature request, you **must** query GitHub to verify whether an equivalent issue already exists:

```bash
# Search for related existing issues
gh issue list --search "<keyword>" --state all --limit 20

# Check open pull requests
gh pr list --search "<keyword>" --state all --limit 20
```

Read [AGENTS.md](AGENTS.md) for full instructions, templates, and safety doctrines.

---

## 📄 License

This project is open-source under the terms of the [MIT License](LICENSE).
Copyright (c) 2026 AIKit LLC & Tuan Nguyen.
