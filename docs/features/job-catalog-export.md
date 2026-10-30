# Job catalog search and admin export (DL-32 phase 1)

Admins download the same filtered catalog the public jobs API shows. Search also matches the job description, not only the title, company, skills, location, and department.

Out of scope for this phase: multi-keyword `/subscribe`, and industry or company-size filters.

## Search

`GET /api/jobs` still accepts `search` or `q`, plus `grade` / `seniority`, `tech_category`, `region`, `state` (paged), and `tech_only` (default true).

`JobRepository.list` and `JobRepository.listPaged` share `buildJobCatalogWhere`. The pagination `COUNT(*)` uses that same `WHERE`, including `tech_only` and both description columns (`description_summary`, `raw_content`). `JobRepository.count` stays the unfiltered public total and is unchanged.

The public response cache key is `api:jobs:v8` so a cached search from before description matching is not reused.

The term is bound as a `LIKE` pattern. It is not concatenated into the SQL string.

## Export

`GET /api/jobs/export?format=csv|json` repeats those filters.

| Format | Behavior |
| --- | --- |
| `csv` | Chunked `text/csv` body, RFC 4180, `Content-Disposition: attachment`. Page size 100. Stops at 5,000 rows and sets `X-Export-Truncated: true` when the filter matches more. Ignores `page` and `limit`. |
| `json` | `{ format, items, pagination }`. `limit` cannot exceed 100. `page` selects the next window. |

The route is an admin route: header token (`x-admin-token` or `Authorization: Bearer`) or the `admin_session` cookie. Query-string tokens are ignored. Failed attempts use the existing admin auth limiter. Responses are `Cache-Control: private, no-store` and `Vary: Cookie`.

CSV cells whose first character is `=`, `+`, `-`, `@`, tab, or CR are prefixed with `'` before quoting, so a job title cannot become a spreadsheet formula.

The file includes apply targets and raw description text. That is why the download is admin-only.

## Code map

| Piece | Role |
| --- | --- |
| `src/db/job-catalog-search.ts` | Shared `LIKE` clause |
| `src/db/repositories.ts` | `buildJobCatalogWhere` used by `list` and `listPaged` |
| `src/jobs/job-catalog-filters.ts` | Query-string filters for both routes |
| `src/export/csv-rfc4180.ts` | Quoting and formula guard |
| `src/export/csv-job-catalog-exporter.ts` | CSV strategy |
| `src/export/json-job-catalog-exporter.ts` | JSON strategy |
| `src/export/job-catalog-export-factory.ts` | Chooses the strategy from `format` |
| `src/http/job-export-route.ts` | Auth, validation, response |
| `src/index.ts` | Registers the route and the admin-route gate |
