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
- **Test Framework**: Vitest (17 suites, 178 automated unit, integration, and red-team tests)

---

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
# Run full Vitest suite (178 tests across 17 test files)
npm test

# Verify strict TypeScript types
npm run typecheck
```

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
