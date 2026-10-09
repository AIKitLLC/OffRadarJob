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
