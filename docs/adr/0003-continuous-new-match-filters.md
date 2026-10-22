# ADR 0003: Continuous new-match filters

## Decision

Saved profiles and filters live in D1. After job extraction, and again on the existing daily cron, the worker scores open jobs that survived the quality pass and inserts a match alert only when the alert key `profileId:jobId:contentHash` is new.

Filters constrain keywords, seniority, location, remote, sponsorship, and a minimum score. A changed content hash can alert again. The same hash cannot.

## Options

| Option | Idempotence | Uses current queue and cron | New infrastructure | Score |
| --- | --- | --- | --- | --- |
| New match queue | 8 | 5 | Required | 5.5 |
| Poll from the existing extract consumer and daily cron, unique alert key in D1 | 9 | 10 | None | 9.5 |

No new queue, Worker, or binding is added. The extract consumer already runs on `job-extract-queue`. The daily cron already lists jobs and notifies subscribers. The new pass is a step in those two places. A failure there is logged and does not retry the crawl.

## Trade-offs

Alerts are per profile and content hash, so two filters on one profile still produce one alert for a job. The pass looks at the jobs it was given (the extract batch, or up to 40 recent open jobs on the cron), not the full historical catalogue. Interactive `POST /api/user/match-alerts/scan` is scoped to that user and uses the rule layer only.

## Consequences

`match_alerts.alert_key` is unique. Clients read `GET /api/user/match-alerts` or the MCP tool `list_new_match_alerts`.
