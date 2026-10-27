# ADR 0004: Pure domain packages for CV strategy, applications, community and analytics

## Decision

New domain logic lives in pure packages under `src/`:

| Package | Scope | Epic |
| --- | --- | --- |
| `src/cv-strategy/` | CV parsing, scoring, rewrite and metric suggestions | #11 |
| `src/applications/` | Application status, follow-ups, funnel | #24 |
| `src/community/` | Curated lists, crowd signals, digests, employer intake rules | #33 |
| `src/analytics/` | Click and outcome measurement rules | #39 |

Each package is a set of pure functions. It does not import `src/db`, `src/http`, `src/agents`, `src/orchestrator`, `src/pipeline`, `src/ui`, `src/mcp`, Worker bindings, or anything that does network or storage I/O.

Allowed imports, beyond files inside the same package:

| Module | Why |
| --- | --- |
| `zod` | Contracts and input bounds |
| `src/types/domain.ts` | `Result`, `Ok`, `Err` and shared domain types |
| `src/matching/stable-hash.ts` | SHA-256 content hashes (ADR 0002 convention) |
| `src/services/cv-tag-cloud.ts` (`cv-strategy` only) | The existing skill lexicon. It is deterministic and has no I/O |
| `src/services/apply-url-guard.ts` (`community` only) | Static, network-free URL policy |

Anything else needs a change to this ADR first. `tests/architecture-boundaries.test.ts` fails on a forbidden import, so the rule is enforced on every pull request, not only reported by arcade-agent.

Around each package:

- Storage goes in `src/db/<name>-repository.ts`. `src/db/repositories.ts` does not grow.
- Routes go in `src/http/<name>-routes.ts` and return `Response | null`, like `handleCandidateMatchRoutes`.
- MCP tools go in `src/mcp/<name>-tools.ts`; `src/mcp/mcp-server.ts` only registers them.
- Only `src/index.ts` wires bindings to these modules.
- No new Queue, Worker or binding without a separate ADR (ADR 0003 precedent).

Stored results record a ruleset version and a SHA-256 content hash of their input, as in ADR 0002. Each concept has one name across code, database and API; for example, the ecosystem pillar is `organizationsJoined` in code and `organizations_joined_json` in SQL.

CV-to-job fit stays in `scoreJobMatch` (ADR 0001), and target-group suggestions stay in `DecisionApiService`. `src/cv-strategy/` scores and rewrites the CV itself. It does not replace either.

## Options

| Option | Fit with existing code | Testability | Coupling risk | Score |
| --- | --- | --- | --- | --- |
| Add to `src/services/` and `src/matching/` as #11 first proposed | 7 | 6 | 3 | 5.3 |
| `*Service` classes per capability with interfaces | 6 | 7 | 6 | 6.3 |
| Pure function packages, enforced by a boundary test | 8 | 10 | 9 | 9.0 |

The arcade-agent `0.4.2` baseline on `main` reports Concern Overload (high) for `Matching`, a `Db <-> Services` cycle, and scattered functionality across `Pipeline, Services, Types`. Adding new capabilities to those components would deepen each smell.

## Trade-offs

More directories, and a little wiring code in `src/index.ts` per feature. Packages cannot reuse a repository or adapter directly; callers pass data in. The boundary test reads import specifiers as text, so it does not see dynamic `import()` with computed paths. None exist today.

## Consequences

`src/cv-strategy/parse-cv-bullets.ts` is the first module. It splits CV text into sections and bullets with ids that do not change when an unrelated bullet is edited. Later sub-issues (#17–#19, #27, #28, #31; #25, #29, #30; #34–#38; #39) follow this ADR.
