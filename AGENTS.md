# Agent Guidelines: Proactive GitHub Issue Creation & Deduplication

This document provides mandatory operational protocols for autonomous AI agents (Cursor, Claude, Antigravity, GitHub Copilot Workspace, etc.) interacting with this repository.

---

## 1. Golden Rule: Always Check for Duplicates First

**BEFORE** creating any new GitHub issue, bug report, or feature request, the agent **MUST** run a duplicate check against both open and closed issues.

### Deduplication CLI Protocol

1. **Search by Key Technical Terms**:
   ```bash
   gh issue list --search "<keyword>" --state all --limit 20
   ```
   *Example:*
   ```bash
   gh issue list --search "rerank" --state all
   gh issue list --search "Decision API" --state all
   gh issue list --search "CV optimization" --state all
   ```

2. **List Recent Issues**:
   ```bash
   gh issue list --state all --limit 30
   ```

3. **Check Pull Requests**:
   ```bash
   gh pr list --search "<keyword>" --state all --limit 20
   ```

### Deduplication Decision Gate
- **If an identical or strongly overlapping issue exists (Open)**:
  - **DO NOT** create a new issue.
  - Reference or link to the existing issue ID (`#<id>`).
- **If an issue was previously closed/resolved**:
  - Verify whether the previous resolution covers the current condition or if this is a distinct regression.
  - If distinct, cite the previous issue (`Relates to #<prev_id>`) and describe the delta.
- **If no duplicate is found**: Proceed to Step 2.

---

## 2. Issue Standards & Structure

Every issue created by an agent must follow the standard structure:

### Issue Title
`feat(<scope>): <concise description>` or `fix(<scope>): <concise description>`

### Issue Body Template
```markdown
## Context & Motivation
<!-- What problem is being solved, or what capability is being added? -->

## Proposed Solution / Technical Specification
<!-- Detail changes to schemas, services, API endpoints, and UI -->

## Verification & Acceptance Criteria
- [ ] Typecheck passes: `npm run typecheck`
- [ ] Test suite passes: `npm test`
- [ ] Deterministic verification with reproducible assertions
- [ ] No regression on existing core pipelines

## Red-Team / Edge Case Considerations
<!-- Potential failure modes: API timeouts, missing bindings, cold-starts, malformed inputs -->

## Maintainer Alignment
<!-- Follows existing code patterns and conventions -->
```

---

## 3. GitHub CLI Command for Issue Creation

Once deduplication check passes:
```bash
gh issue create \
  --title "feat(reranker): continuous JD reranking and Cloudflare Decision API for CV optimization" \
  --body "..." \
  --label "enhancement"
```

---

## 4. Doctrine & Safety Policies

- Target personal or organization repositories (`AIKitLLC/OffRadarJob` or `tuannx/*`) as designated by configuration.
- Do not add blanket linter/type suppressions (`any`, `@ts-ignore`) to pass CI.
- Always include automated test coverage for newly introduced services and endpoints.

---

## 5. Engineering Lessons & Retrospective Rules (PRs #1–#10)

Every agent working on this repository must apply the following lessons distilled from PR reviews (#1–#10):

1. **Zero Local Deployments (PR #7, Issue #9 — P0 Policy)**
   - **NEVER** run `wrangler deploy` or `wrangler d1 migrations apply --remote` from a local machine.
   - All production deployments and remote D1 migrations must run exclusively via `.github/workflows/ci.yml` after merging to `main`.
   - `npm run deploy` and `npm run db:migrate:remote` call `scripts/require-ci.mjs` first and exit with an error outside GitHub Actions. Do not work around it; calling `wrangler` directly is the same violation.
   - On `main`, missing Cloudflare secrets fail the deploy job. Never add a skip path that reports green without deploying.

2. **Non-Destructive Migrations & 3-Tier Data Recovery (PR #10)**
   - Do **not** blindly `DELETE` or permanently close rows in SQL migrations when application-level recovery is possible. Flag broken rows (`link_status = 'invalid'`, `status = 'not_found'`) in the migration first.
   - Recover broken data in 3 tiers before quarantining:
     1. **Offline deterministic repair** (e.g., XOR-decoding `/cdn-cgi/l/email-protection#<hex>` or normalizing `mailto:`).
     2. **Bounded source re-research** (`SourceReResearcher` re-crawling the company's career page/homepage with strict fetch budget, timeout, body cap, and 7-day retry cooldown).
     3. **Non-destructive quarantine** (`status = 'closed'`, `closed_reason = 'invalid_link'`).

3. **Narrowly Anchored DB Triggers & Ingest Immutability (PR #10)**
   - Anchor SQLite `BEFORE INSERT` / `BEFORE UPDATE` triggers to exact artifact paths (`LIKE '%/cdn-cgi/l/email-protection%'`), never broad keywords (`LIKE '%email-protection%'`) that cause false positives on legitimate job slugs (e.g. `/careers/email-protection-engineer`).
   - Repository write methods (`JobRepository.upsert`) must normalize data on local variables without mutating the caller's object reference, and read mappers (`mapRowToJob`) must reflect stored DB state honestly.
   - When scraping obfuscated elements (`[data-cfemail]`), iterate over all matching elements until a valid decode succeeds rather than only inspecting `.first()`.

4. **Outbound Fetch SSRF Guard & Per-Hop Redirect Validation (PR #2, PR #8, PR #10)**
   - Any outbound crawler/checker (`fetchValidatedApplyUrl`, `SourceReResearcher`) must validate the target URL with `isBlockedApplyHost` / `validateApplyUrl` **before** every request and on **every manual redirect hop** (`redirect: "manual"`).
   - Reject localhost, private/loopback/link-local IP literals (IPv4, IPv6, integer/hex/short-dotted forms), internal suffixes (`.local`, `.internal`), and DNS-rebinding suffixes (`.nip.io`, `.sslip.io`).
   - Enforce an explicit per-invocation subrequest budget so background tasks cannot exhaust Cloudflare Worker subrequest limits.

5. **True Async HTTP Semantics & Strict Input Validation (PR #10)**
   - When an endpoint supports `async: true`, dispatch the work inside `ctx.waitUntil(...)` and return **`202 Accepted`** immediately — never `await` the background promise before returning.
   - Validate request body fields (`batchSize`, `async`, `runLiveCheck`) at runtime (`typeof`, `Number.isFinite`) instead of relying on TypeScript `as` casts.

6. **Auth Hardening, Distributed Durable Object Rate Limiting, & Cache Safety (PR #1, PR #3, PR #4, PR #8)**
   - Never hardcode fallback tokens/secrets; use timing-safe comparisons and HMAC-signed session cookies (`__Host-admin_session`).
   - Enforce rate limits across isolates via SQLite-backed Durable Objects (`AdminAuthLimiter`, `MatchScanLimiter`) and **fail closed** when the limiter is unavailable.
   - Only record failed admin auth attempts when a request actually presents an invalid credential; never let unauthenticated anonymous traffic trigger admin lockouts.
   - Render admin UI entry points server-side only for authenticated admin sessions with `Cache-Control: private, no-store` and `Vary: Cookie` (no logged-out `/api/admin/session` probes).

