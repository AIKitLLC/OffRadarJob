# ADR 0002: Job quality decisions

## Decision

Classify each gathered job with a versioned rule layer, then optionally a Workers AI judge. The stored decision records the ruleset version, a SHA-256 of the canonical job snapshot plus the validated judge JSON, the action (`keep`, `enrich`, `drop`), and the source (`rules` or `workers_ai`).

Hard rules drop spam phrases, duplicate title/company/apply fingerprints, closed jobs, and jobs last seen more than 14 days ago. A complete posting is kept without calling a model. Everything else is review. The judge runs only on review, at temperature 0, model `@cf/meta/llama-3.1-8b-instruct` (the same instruct model the Decision API already calls). It may drop a review posting only when it labels the posting spam or duplicate. It cannot override a hard drop or a hard keep, and it cannot promote a thin posting to keep.

`drop` sets `jobs.status` to `closed`. `enrich` copies lexicon skills found in the posting onto an empty or sparse skill list. Public job lists and counts now read open jobs only.

## Options

| Option | Recall | Reproducibility | Fit with current AI binding | Score |
| --- | --- | --- | --- | --- |
| Workers AI only | 7 | 3 | 8 | 6.0 |
| Rules only | 6 | 10 | 7 | 7.7 |
| Rules decide hard cases; logged Workers AI judge on review | 8 | 8 | 9 | 8.3 |

## Trade-offs

A live model call is reproducible only as a replay of the stored judge JSON. If the model is unavailable or returns invalid JSON, the provisional rule action is stored and not retried for that content hash and ruleset version. Duplicate detection sees only the jobs in the current pass. The cron allows 5 judge calls; queue extraction allows 2; interactive scans use rules only.

Link-status checking is a separate concern and is not reimplemented here.

## Consequences

Decisions are written to `job_quality_decisions` and emitted as structured logs (`event: job_quality_decision`). Apply migration `0016_candidate_profiles_quality_and_match_alerts.sql` before relying on the pass in production.
