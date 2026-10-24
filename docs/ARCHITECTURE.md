# Architecture

One Cloudflare Worker (`off-radar-jobs`, entry `src/index.ts`) with D1 (`DB`), KV (`CACHE`), Workers AI (`AI`), Queues (discovery, profile, career-hunt, job-extract, DLQ), a Durable Object (`AdminAuthLimiter`) and cron triggers. See `wrangler.jsonc`.

## Directories

| Path | Role |
| --- | --- |
| `src/index.ts` | Worker entry: fetch, queue and scheduled handlers. Composition root. |
| `src/http`, `src/ui` | Routes and server-rendered pages. |
| `src/orchestrator`, `src/pipeline` | Queue dispatch and pipeline steps. |
| `src/agents` | Discovery, profiler, career-hunter and job-extractor agents. |
| `src/harvesters`, `src/services` | Adapters for external sources and services. |
| `src/matching`, `src/quality`, `src/alerts` | Pure domain logic: scoring, quality decisions, new-match alerts. |
| `src/db` | D1 repositories and types. |
| `src/durable` | Durable Object classes. |
| `src/mcp` | MCP server. |
| `src/demo`, `src/scripts`, `src/seeds` | Local tooling; not part of the deployed request path. |

Decisions: `docs/adr/`.

## Target boundaries

- Domain logic (`matching`, `quality`, `alerts`) does not import Worker bindings, `db`, or adapters.
- Adapters are the only code that calls external HTTP sources.
- Only `src/index.ts` wires bindings to modules.

These are targets, not yet enforced by a test. `architecture.yml` (arcade-agent) reports drift on pull requests and does not block.
