# Status

Last updated: 2026-10-24. Update this file in the same pull request as the change it describes.

## Open issues

- #9 [P0][CI/CD] CI-only deploys (no local deploy)
- #11 feat(cv-strategy): decoupled async services for CV optimization and matching

## Open pull requests

- #8 fix: restrict link checks, scan limits, and homepage admin entry
- This change: dev standards rollout (draft)

## Recently merged

#10, #12, #13, #14 on 2026-10-24 (link-quality trigger, leaked-token tests on CI, gitleaks baseline and scan workflow).

## CI

- `ci.yml`: typecheck and tests; production deploy from `main` only.
- `architecture.yml`: arcade-agent report-only, actions pinned to commit SHAs, `contents: read` only.
- `gitleaks.yml`: secret scan.

## Tracking setup (proposed, not created)

Labels: `type:feature|bug|chore|docs`, `area:harvesters|matching|quality|alerts|ui|mcp`, `status:ready|in-progress|in-review|blocked`, `priority:p0|p1|p2`.
