import type { ID1Database } from "../db/types.js";
import { LogRepository } from "../db/repositories.js";
import { expireStaleJobs, runLinkCheckBatch, type FetchLike, type LinkCheckBatchSummary } from "./link-checker.js";

/**
 * Link-check cron. Runs 18 times a day right after the 02:00 UTC crawl
 * (02:15–07:55 UTC, every 20 min) so each invocation stays far below the
 * Worker subrequest limit (50 on Free, 1000 on Paid) and CPU budget.
 * Throughput = runs/day x LINK_CHECK_BATCH_SIZE; raise the batch size on Paid.
 */
export const LINK_CHECK_CRON = "15,35,55 2-7 * * *";

export interface LinkQualityEnv {
  DB: ID1Database;
  LINK_CHECK_BATCH_SIZE?: string;
  LINK_CHECK_MAX_SUBREQUESTS?: string;
  JOB_STALE_DAYS?: string;
}

function intVar(v: string | undefined, fallback: number): number {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function runLinkQualityCron(
  env: LinkQualityEnv,
  fetchFn: FetchLike = (input, init) => fetch(input, init),
  now: number = Date.now()
): Promise<{ expired: number; check: LinkCheckBatchSummary }> {
  const started = Date.now();
  const expired = await expireStaleJobs(env.DB, { staleDays: intVar(env.JOB_STALE_DAYS, 14), now });
  const check = await runLinkCheckBatch(env.DB, fetchFn, {
    batchSize: intVar(env.LINK_CHECK_BATCH_SIZE, 20),
    maxSubrequests: intVar(env.LINK_CHECK_MAX_SUBREQUESTS, 40),
    now,
  });
  try {
    await new LogRepository(env.DB).log({
      id: `log_link_check_${now}`,
      agentName: "link_checker",
      targetUrl: "cron://link-check",
      status: "success",
      durationMs: Date.now() - started,
      message: `Link check: ${check.checked} checked, ${check.ok} ok, ${check.failed} failed, ${check.unverifiable} unverifiable, ${check.closed} closed; ${expired} stale jobs expired.`,
      metadata: { ...check, expired },
      createdAt: now,
    });
  } catch (err) {
    console.error("[LinkCheckCron] failed to write crawl log", err);
  }
  return { expired, check };
}
