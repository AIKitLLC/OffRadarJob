# Job catalog search and admin export (DL-32 phase 1)

Admins download the filtered catalog. Public search matches the short description, not the stored raw posting.

Out of scope for this phase: multi-keyword `/subscribe`, and industry or company-size filters.

## Search

`GET /api/jobs` accepts `search` or `q`, plus `grade` / `seniority`, `tech_category`, `region`, `state` (paged), and `tech_only` (default true).

The trimmed `search` or `q` value must be at most 100 characters. A longer value returns **400** with `search must be at most 100 characters`. The API does not truncate the term.

`JobRepository.list` and `JobRepository.listPaged` share `buildJobCatalogWhere`. The pagination `COUNT(*)` uses that same `WHERE`, including `tech_only` and `description_summary`. `raw_content` is not searched. `JobRepository.count` stays the unfiltered public total.

`\`, `%`, and `_` in the term are escaped and matched with `LIKE ... ESCAPE '\'`, so they are literal characters.

The public response includes `descriptionSummary` and omits `rawContent`. Emails and phone numbers in that summary are replaced with `[redacted-email]` and `[redacted-phone]`, the same redaction the export uses. The cache key is `api:jobs:v10`. `GET /api/reports/realtime-jd-ranking` maps each ranked job through the same public view. Its cache key is `report:rerank:live:v2`.

After deploy, purge the CDN cache. Older cached `/api/jobs` and ranking responses can still contain `rawContent` or unredacted contact text until that cache expires.

## Export

`GET /api/jobs/export?format=csv|json` repeats those filters, including the 100-character search limit (400, not truncated).

| Format | Behavior |
| --- | --- |
| `csv` | Chunked `text/csv` body, RFC 4180, `Content-Disposition: attachment`. Page size 100. Stops at 5,000 rows and sets `X-Export-Truncated: true` when the filter matches more. Ignores `page` and `limit`. |
| `json` | `{ format, items, pagination }`. `limit` cannot exceed 100. `page` selects the next window. |

`rawContent` is not an export column and is not a JSON field. Emails and phone numbers are removed from the exported `descriptionSummary` (`[redacted-email]`, `[redacted-phone]`). A salary or a year written as digits is left as-is. `applyTarget` is unchanged, because that is the application channel.

The route is an admin route: header token (`x-admin-token` or `Authorization: Bearer`) or the `admin_session` cookie. Query-string tokens are ignored. Failed attempts use the existing admin auth limiter. Responses are `Cache-Control: private, no-store` and `Vary: Cookie`.

CSV cells whose first character is `=`, `+`, `-`, `@`, tab, or CR are prefixed with `'` before quoting.

## Code map

| Piece | Role |
| --- | --- |
| `src/db/job-catalog-search.ts` | Shared `LIKE` clause, wildcard escape, 100-character limit |
| `src/db/repositories.ts` | `buildJobCatalogWhere` used by `list` and `listPaged` |
| `src/jobs/public-job-view.ts` | Drops `rawContent` from `/api/jobs` |
| `src/jobs/job-catalog-filters.ts` | Query-string filters for both routes |
| `src/export/redact-export-text.ts` | Email and phone redaction |
| `src/export/csv-rfc4180.ts` | Quoting and formula guard |
| `src/export/csv-job-catalog-exporter.ts` | CSV strategy |
| `src/export/json-job-catalog-exporter.ts` | JSON strategy |
| `src/export/job-catalog-export-factory.ts` | Chooses the strategy from `format` |
| `src/http/job-export-route.ts` | Auth, validation, response |
| `src/index.ts` | Registers the route and the admin-route gate |
