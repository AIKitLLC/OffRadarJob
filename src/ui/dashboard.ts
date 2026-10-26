export interface PublicDashboardStats {
  companiesCount: number;
  jobsCount: number;
  seniorCount: number;
  midwestPercent: number;
  regionalBreakdown: {
    midwest: number;
    west: number;
    northeast: number;
    south: number;
    mountain: number;
  };
}

/** Renders a server-side count, or nothing when the value is missing or not positive (never a placeholder 0). */
function ssrCount(value: number | undefined | null): string {
  return typeof value === "number" && value > 0 ? value.toLocaleString("en-US") : "";
}

/**
 * Renders the public dashboard. When `stats` holds real data from D1, the counters are
 * rendered on the server so crawlers and no-JS clients see real values. Without data, the
 * counter grid is hidden and region counts are left empty until /api/stats returns data.
 */
export interface DashboardRenderOptions {
  /** Include the admin entry link. Omit for anyone who is not an admin. */
  includeAdminLink?: boolean;
}

export function renderDashboardHtml(stats?: PublicDashboardStats | null, options?: DashboardRenderOptions): string {
  const hasStats = !!stats && stats.jobsCount > 0;
  const rb = hasStats ? stats!.regionalBreakdown : undefined;
  const midwestPct = hasStats && rb && rb.midwest > 0 ? `${stats!.midwestPercent}%` : "";
  const showAdmin = options?.includeAdminLink === true;
  const adminLink = showAdmin
    ? `<a href="/admin" id="admin-link" style="text-decoration: none; color: #38bdf8; font-size: 13px; font-weight: 600; padding: 6px 14px; border: 1px solid #1f2a44; border-radius: 8px; background: #131b2e;">⚙️ Admin</a>`
    : "";
  const seedIngest = showAdmin
    ? `<div class="crawl-trigger" id="seed-ingest">
      <h2>🚀 Ingest & Dispatch New Seed Domain</h2>
      <div class="input-group">
        <input type="text" id="seed-input" placeholder="e.g. https://promptloop.com, https://sixfeetup.com, https://bendyworks.com" />
        <button id="btn-crawl" onclick="triggerCrawl()">Dispatch to Discovery Queue</button>
      </div>
      <div class="quick-seeds">
        <span>Vetted Regional Studios:</span>
        <span class="quick-seed-chip" onclick="fillSeed('https://promptloop.com')">PromptLoop (Chicago, IL • AI)</span>
        <span class="quick-seed-chip" onclick="fillSeed('https://sixfeetup.com')">Six Feet Up (Carmel, IN • AWS)</span>
        <span class="quick-seed-chip" onclick="fillSeed('https://postlight.com')">Postlight (New York, NY • Studio)</span>
        <span class="quick-seed-chip" onclick="fillSeed('https://substantial.com')">Substantial (Seattle, WA • Studio)</span>
        <span class="quick-seed-chip" onclick="fillSeed('https://modernize.com')">Modernize (Austin, TX • South)</span>
        <span class="quick-seed-chip" onclick="fillSeed('https://automox.com')">Automox (Boulder, CO • Mountain)</span>
      </div>
    </div>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OffRadarJob — Micro-Company Job Gathering Platform (US-Midwest Focus)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #131b2e;
      --card-border: #1f2a44;
      --text: #e2e8f0;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --primary-hover: #0284c7;
      --accent: #a855f7;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --midwest: #f43f5e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.6;
      padding: 24px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--card-border);
    }
    .brand h1 {
      font-size: 24px;
      font-weight: 700;
      background: linear-gradient(135deg, #38bdf8, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand p { color: var(--text-muted); font-size: 13px; margin-top: 4px; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(16, 185, 129, 0.1);
      color: var(--success);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid rgba(16, 185, 129, 0.2);
    }
    .status-dot {
      width: 8px; height: 8px; border-radius: 50%; background-color: var(--success);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.15); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }

    .midwest-banner {
      background: linear-gradient(135deg, rgba(244, 63, 94, 0.12), rgba(168, 85, 247, 0.12));
      border: 1px solid rgba(244, 63, 94, 0.3);
      border-radius: 12px;
      padding: 14px 20px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .midwest-banner-text { font-size: 13px; color: #fecdd3; }
    .midwest-banner-text strong { color: #fff; }
    .midwest-tag {
      background: rgba(244, 63, 94, 0.2);
      color: #fda4af;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .stats-grid[hidden] {
      display: none;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
    }
    .stat-label { font-size: 13px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 32px; font-weight: 700; color: #fff; margin-top: 8px; }
    
    [hidden] { display: none !important; }
    .crawl-trigger {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 32px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .crawl-trigger h2 { font-size: 16px; font-weight: 600; }
    .input-group { display: flex; gap: 12px; }
    input[type="text"] {
      flex: 1;
      background: #0b1120;
      border: 1px solid var(--card-border);
      color: #fff;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
    }
    input[type="text"]:focus { border-color: var(--primary); }
    button {
      background: var(--primary);
      color: #0b1120;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: var(--primary-hover); }

    .quick-seeds {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      font-size: 12px;
      color: var(--text-muted);
    }
    .quick-seed-chip {
      background: #1e293b;
      color: #cbd5e1;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
      border: 1px solid var(--card-border);
      transition: all 0.2s;
    }
    .quick-seed-chip:hover {
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
      border-color: var(--primary);
    }
    
    .filter-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .nav-tabs {
      display: flex;
      gap: 16px;
      border-bottom: 1px solid var(--card-border);
    }
    .tab-btn {
      background: transparent;
      color: var(--text-muted);
      border-bottom: 2px solid transparent;
      border-radius: 0;
      padding: 12px 16px;
      font-size: 14px;
      cursor: pointer;
    }
    .tab-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
      font-weight: 600;
    }

    .region-select {
      background: #0b1120;
      border: 1px solid var(--card-border);
      color: #fff;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
    }

    .tab-content { display: none; }
    .tab-content.active { display: block; }

    .job-list { display: flex; flex-direction: column; gap: 16px; }
    .job-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
    }
    .job-main h3 { font-size: 18px; font-weight: 600; color: #fff; }
    .job-company { color: var(--primary); font-size: 14px; margin-top: 4px; display: inline-block; text-decoration: none; }
    .job-desc { color: var(--text-muted); font-size: 13px; margin: 10px 0; }
    .job-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .tag {
      background: rgba(56, 189, 248, 0.1);
      color: var(--primary);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
    }
    .tag-midwest { background: rgba(244, 63, 94, 0.2); color: #fda4af; border: 1px solid rgba(244, 63, 94, 0.4); font-weight: 600; }
    .tag-west { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.4); font-weight: 600; }
    .tag-northeast { background: rgba(99, 102, 241, 0.2); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.4); font-weight: 600; }
    .tag-south { background: rgba(245, 158, 11, 0.2); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.4); font-weight: 600; }
    .tag-mountain { background: rgba(6, 182, 212, 0.2); color: #67e8f9; border: 1px solid rgba(6, 182, 212, 0.4); font-weight: 600; }
    .job-card.job-card-midwest {
      border: 1px solid rgba(244, 63, 94, 0.45);
      background: linear-gradient(135deg, rgba(244, 63, 94, 0.08), var(--card-bg));
      box-shadow: 0 4px 14px rgba(244, 63, 94, 0.08);
    }
    .region-pills-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 16px 0 24px 0;
      align-items: center;
    }
    .region-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid var(--border);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .region-pill:hover, .region-pill.active {
      background: rgba(56, 189, 248, 0.12);
      border-color: var(--primary);
      color: #fff;
    }
    .pill-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }
    .tag-remote { background: rgba(168, 85, 247, 0.2); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.4); font-weight: 600; }
    .tag-salary { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
    .apply-btn {
      white-space: nowrap;
      background: linear-gradient(135deg, #38bdf8, #6366f1);
      color: #fff;
      text-decoration: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      display: inline-block;
    }

    .companies-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
    }
    .company-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .company-card.company-card-midwest {
      border: 1px solid rgba(244, 63, 94, 0.45);
      background: linear-gradient(135deg, rgba(244, 63, 94, 0.06), var(--card-bg));
      box-shadow: 0 4px 14px rgba(244, 63, 94, 0.06);
    }
    .company-header { display: flex; justify-content: space-between; align-items: center; }
    .company-name { font-size: 16px; font-weight: 700; color: #fff; text-decoration: none; }
    .company-badge {
      background: #1e293b;
      color: var(--text-muted);
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .company-desc { font-size: 13px; color: var(--text-muted); flex: 1; }

    .log-terminal {
      background: #0b101b;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      max-height: 500px;
      overflow-y: auto;
    }
    .log-row {
      display: flex;
      gap: 12px;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .log-agent { color: var(--accent); font-weight: 500; min-width: 140px; }
    .log-status-success { color: var(--success); }
    .log-status-warning { color: var(--warning); }
    .log-status-error { color: var(--danger); }
    .log-time { color: var(--text-muted); min-width: 65px; }
    .tag-grade-founding { background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); font-weight: 700; }
    .tag-grade-lead { background: rgba(234, 179, 8, 0.15); color: #facc15; border: 1px solid rgba(234, 179, 8, 0.3); font-weight: 600; }
    .tag-grade-senior { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
    .tag-grade-mid { background: rgba(45, 212, 191, 0.15); color: #2dd4bf; }
    .tag-grade-junior { background: rgba(52, 211, 153, 0.15); color: #34d399; }
    .tag-grade-newgrad { background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(14, 165, 233, 0.2)); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.45); font-weight: 700; box-shadow: 0 0 8px rgba(16, 185, 129, 0.15); }
    .tag-cat { background: #1e1b4b; color: #a5b4fc; border: 1px solid #312e81; }

    .filter-controls {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }

    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 8px;
      margin-top: 20px;
      border-top: 1px solid var(--card-border);
      flex-wrap: wrap;
      gap: 12px;
    }
    .pagination-info {
      font-size: 13px;
      color: var(--text-muted);
    }
    .pagination-info strong {
      color: #fff;
    }
    .pagination-buttons {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .page-btn {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .page-btn:hover:not(:disabled) {
      border-color: var(--primary);
      color: #fff;
      background: rgba(56, 189, 248, 0.1);
    }
    .page-btn.active {
      background: var(--primary);
      color: #0b0f19;
      border-color: var(--primary);
      font-weight: 700;
    }
    .page-btn:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }

    /* Auth & MCP & CV Styles */
    .header-btn {
      background: #1e293b;
      color: #38bdf8;
      border: 1px solid var(--card-border);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .header-btn:hover {
      background: rgba(56, 189, 248, 0.15);
      border-color: var(--primary);
    }
    .header-btn-primary {
      background: linear-gradient(135deg, #0284c7, #2563eb);
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: transform 0.15s, opacity 0.15s;
    }
    .header-btn-primary:hover {
      opacity: 0.95;
      transform: translateY(-1px);
    }
    .header-btn-secondary {
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--card-border);
      padding: 6px 10px;
      border-radius: 8px;
      font-size: 12px;
      cursor: pointer;
    }
    .header-btn-secondary:hover {
      color: #fff;
      border-color: #475569;
    }
    .user-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.25);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 13px;
      color: #e2e8f0;
    }
    .user-pill strong { color: var(--primary); }

    /* Subscription Banner */
    .subscription-banner {
      background: linear-gradient(90deg, rgba(56, 189, 248, 0.08) 0%, rgba(99, 102, 241, 0.08) 100%);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .sub-banner-content {
      display: flex;
      align-items: center;
      gap: 14px;
      flex: 1;
      min-width: 260px;
    }
    .sub-banner-icon {
      font-size: 24px;
      background: rgba(56, 189, 248, 0.15);
      border-radius: 10px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .sub-banner-text strong {
      font-size: 14.5px;
      color: #f8fafc;
      display: block;
      margin-bottom: 3px;
    }
    .sub-banner-text p {
      font-size: 12.5px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.4;
    }
    .sub-banner-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn-sub-action {
      background: var(--primary);
      color: #0b1120;
      border: none;
      padding: 9px 18px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .btn-sub-action:hover {
      background: var(--primary-hover);
      transform: translateY(-1px);
    }
    .btn-sub-action.active {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .btn-sub-action.active:hover {
      background: rgba(239, 68, 68, 0.25);
    }

    /* Modals */
    .modal-backdrop {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(9, 13, 22, 0.85);
      backdrop-filter: blur(5px);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-backdrop.active {
      display: flex;
    }
    .modal-content {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      width: 100%;
      max-width: 680px;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      position: relative;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 12px;
    }
    .modal-header h3 {
      font-size: 18px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .modal-close-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 20px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .modal-close-btn:hover {
      color: #fff;
      background: #1e293b;
    }
    .code-snippet {
      background: #0b1120;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 12px 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #93c5fd;
      position: relative;
      overflow-x: auto;
      white-space: pre;
    }
    .copy-chip-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 11px;
      cursor: pointer;
    }
    .copy-chip-btn:hover {
      background: var(--primary);
      color: #0b0f19;
    }
    .tailor-btn {
      background: linear-gradient(135deg, #a855f7, #6366f1);
      color: #fff;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .tailor-btn:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }
    .score-meter {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #0b1120;
      border: 1px solid var(--card-border);
      padding: 12px 16px;
      border-radius: 10px;
    }
    .score-meter-bar {
      flex: 1;
      height: 10px;
      background: #1e293b;
      border-radius: 9999px;
      overflow: hidden;
    }
    .score-meter-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .cv-card-item {
      background: #0b1120;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .tg-bot-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: linear-gradient(135deg, #2AABEE 0%, #229ED9 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(42, 171, 238, 0.4);
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .tg-bot-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(42, 171, 238, 0.6);
      background: linear-gradient(135deg, #38bdf8 0%, #2AABEE 100%);
    }
    .tg-sync-container {
      background: rgba(14, 165, 233, 0.08);
      border: 1px solid rgba(14, 165, 233, 0.25);
      border-radius: 10px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      text-align: left;
    }
    .radar-spinner {
      width: 22px;
      height: 22px;
      border: 2px solid rgba(56, 189, 248, 0.2);
      border-top-color: #38bdf8;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      flex-shrink: 0;
    }
    .quick-demo-btn {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #cbd5e1;
      font-size: 11px;
      font-weight: 600;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .quick-demo-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.25);
    }

    /* Synchronized Tag Cloud & CV Import Styles */
    .tag-cloud-wrapper {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .tag-cloud-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: default;
      border: 1px solid transparent;
      user-select: none;
    }
    .tag-cloud-chip:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }
    .chip-cat-languages { background: rgba(6, 182, 212, 0.15); color: #67e8f9; border-color: rgba(6, 182, 212, 0.35); }
    .chip-cat-frameworks { background: rgba(59, 130, 246, 0.15); color: #93c5fd; border-color: rgba(59, 130, 246, 0.35); }
    .chip-cat-cloud_infra { background: rgba(168, 85, 247, 0.15); color: #d8b4fe; border-color: rgba(168, 85, 247, 0.35); }
    .chip-cat-ai_ml { background: rgba(244, 63, 94, 0.15); color: #fda4af; border-color: rgba(244, 63, 94, 0.35); }
    .chip-cat-database { background: rgba(16, 185, 129, 0.15); color: #6ee7b7; border-color: rgba(16, 185, 129, 0.35); }
    .chip-cat-architecture { background: rgba(245, 158, 11, 0.15); color: #fcd34d; border-color: rgba(245, 158, 11, 0.35); }
    .chip-cat-tools { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; border-color: rgba(99, 102, 241, 0.35); }
    .chip-cat-other { background: rgba(148, 163, 184, 0.15); color: #cbd5e1; border-color: rgba(148, 163, 184, 0.35); }

    .chip-status-matched {
      background: rgba(16, 185, 129, 0.18);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.4);
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.15);
    }
    .chip-status-missing {
      background: rgba(245, 158, 11, 0.16);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.4);
      cursor: pointer;
    }
    .chip-status-missing:hover {
      background: rgba(245, 158, 11, 0.28);
      border-color: #f59e0b;
      transform: translateY(-1px);
    }
    .chip-status-cv_only {
      background: rgba(56, 189, 248, 0.14);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .chip-status-deprecated {
      background: rgba(239, 68, 68, 0.16);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.4);
      text-decoration: line-through;
    }

    .file-dropzone {
      border: 2px dashed rgba(56, 189, 248, 0.35);
      border-radius: 12px;
      padding: 24px 16px;
      text-align: center;
      background: rgba(15, 23, 42, 0.5);
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .file-dropzone:hover, .file-dropzone.dragover {
      border-color: var(--primary);
      background: rgba(56, 189, 248, 0.08);
      transform: scale(1.005);
    }
    .file-dropzone input[type="file"] {
      display: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <h1><span>🎯</span> OffRadarJob Gatherer</h1>
        <p>Decoupled Cloudflare Agent Pipeline for Micro-Companies & Unlisted Tech Jobs</p>
      </div>
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <div id="auth-section" style="display: flex; align-items: center; gap: 8px;">
          <!-- Populated by JS -->
        </div>
        ${adminLink}
        <div class="status-badge">
          <span class="status-dot"></span>
          Edge Active
        </div>
      </div>
    </header>

    <div class="midwest-banner">
      <div class="midwest-banner-text">
        <strong>🇺🇸 All 5 US Tech Regions</strong> — Discover off-radar tech jobs from vetted micro-companies & boutique studios: 📍 <strong>Midwest</strong> (Chicago, Indy, Twin Cities) • 🌲 <strong>West</strong> (SF Bay, Seattle, Portland) • 🗽 <strong>Northeast</strong> (NYC, Boston, Philly) • ☀️ <strong>South</strong> (Austin, Atlanta, Raleigh) • 🏔️ <strong>Mountain</strong> (Denver, Salt Lake City).
      </div>
      <span class="midwest-tag">⭐ US Nationwide + Midwest Priority</span>
    </div>

    <div class="stats-grid" id="stats-grid"${hasStats ? "" : " hidden"}>
      <div class="stat-card">
        <span class="stat-label">Micro-Companies</span>
        <span class="stat-value" id="stat-companies">${hasStats ? ssrCount(stats!.companiesCount) : ""}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Tech Jobs</span>
        <span class="stat-value" id="stat-jobs">${hasStats ? ssrCount(stats!.jobsCount) : ""}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Senior / Founding</span>
        <span class="stat-value" id="stat-senior" style="color: #c084fc;">${hasStats ? ssrCount(stats!.seniorCount) : ""}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Midwest Focus</span>
        <span class="stat-value" id="stat-midwest" style="color: #fb7185;">${midwestPct}</span>
      </div>
    </div>

    <div class="region-pills-bar">
      <div class="region-pill active" id="pill-all" onclick="setRegionFilter('all')">
        <span class="pill-dot" style="background: #38bdf8;"></span>
        <span>All US: <strong id="stat-reg-all">${hasStats ? ssrCount(stats!.jobsCount) : ""}</strong></span>
      </div>
      <div class="region-pill" id="pill-midwest" onclick="setRegionFilter('midwest')">
        <span class="pill-dot" style="background: #f43f5e;"></span>
        <span>📍 Midwest: <strong id="stat-reg-midwest">${ssrCount(rb?.midwest)}</strong></span>
      </div>
      <div class="region-pill" id="pill-west" onclick="setRegionFilter('west')">
        <span class="pill-dot" style="background: #10b981;"></span>
        <span>🌲 West: <strong id="stat-reg-west">${ssrCount(rb?.west)}</strong></span>
      </div>
      <div class="region-pill" id="pill-northeast" onclick="setRegionFilter('northeast')">
        <span class="pill-dot" style="background: #6366f1;"></span>
        <span>🗽 Northeast: <strong id="stat-reg-northeast">${ssrCount(rb?.northeast)}</strong></span>
      </div>
      <div class="region-pill" id="pill-south" onclick="setRegionFilter('south')">
        <span class="pill-dot" style="background: #f59e0b;"></span>
        <span>☀️ South: <strong id="stat-reg-south">${ssrCount(rb?.south)}</strong></span>
      </div>
      <div class="region-pill" id="pill-mountain" onclick="setRegionFilter('mountain')">
        <span class="pill-dot" style="background: #06b6d4;"></span>
        <span>🏔️ Mountain: <strong id="stat-reg-mountain">${ssrCount(rb?.mountain)}</strong></span>
      </div>
    </div>

    ${seedIngest}

    <div class="filter-bar">
      <div class="nav-tabs">
        <button class="tab-btn active" onclick="switchTab('jobs')">Gathered Tech Jobs</button>
        <button class="tab-btn" onclick="switchTab('companies')">Micro-Companies Directory</button>
        <button class="tab-btn" onclick="switchTab('rerank')">⚡ Real-time JD Ranking & Decision CV</button>
        <button class="tab-btn" onclick="switchTab('telemetry')">Agent Telemetry & Logs</button>
      </div>
      <div class="filter-controls">
        <input type="text" id="search-input" placeholder="🔍 Search roles, tech, or companies..." class="region-select" style="min-width: 250px;" oninput="onSearchInput()" />
        <button type="button" id="quick-newgrad-btn" class="region-select" onclick="toggleNewGradFilter()" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">🎓 New Grad 2025/2026</button>
        <select id="grade-filter" class="region-select" onchange="applyFilters()">
          <option value="all">🎓 All Grades / Seniority</option>
          <option value="founding">🚀 Founding / Principal</option>
          <option value="lead">👑 Lead / Staff</option>
          <option value="senior">💎 Senior</option>
          <option value="mid">⚡ Mid-Level</option>
          <option value="junior">🌱 Junior</option>
          <option value="new_grad">🎓 New Grad / Entry Level</option>
          <option value="intern">🐣 Intern</option>
        </select>
        <select id="tech-filter" class="region-select" onchange="applyFilters()">
          <option value="all">💻 All Tech Disciplines</option>
          <option value="ai_ml">🤖 AI / LLM & Data Scraping</option>
          <option value="backend_systems">⚙️ Backend & Systems (Rust/Go/Elixir)</option>
          <option value="frontend_ui">🎨 Frontend & UI/UX (React/Next.js)</option>
          <option value="devops_cloud">☁️ Cloud & DevOps (AWS/Cloudflare)</option>
          <option value="product_design">📐 Product Design & Systems</option>
        </select>
        <select id="stage-filter" class="region-select" onchange="applyFilters()">
          <option value="all">💰 All Valuation / Funding</option>
          <option value="bootstrapped">🪙 Bootstrapped / Profitable</option>
          <option value="seed">🌱 Pre-Seed / Seed</option>
          <option value="series_a">🚀 Series A</option>
          <option value="series_b">📈 Series B</option>
          <option value="growth">🦄 Growth / Series C+</option>
          <option value="acquired">🏛️ Acquired / Public</option>
        </select>
        <select id="dept-filter" class="region-select" onchange="applyFilters()">
          <option value="all">🏢 All Hiring Departments</option>
          <option value="Engineering">💻 Engineering & Tech</option>
          <option value="Product & Design">🎨 Product & Design</option>
          <option value="Growth & Marketing">📈 Growth & Marketing</option>
          <option value="Sales">💼 Sales & BD</option>
          <option value="Operations & Support">⚙️ Operations & Support</option>
          <option value="Finance & Legal">⚖️ Finance & Legal</option>
          <option value="People & HR">👥 People & HR</option>
        </select>
        <select id="region-filter" class="region-select" onchange="applyFilters()">
          <option value="all" selected>🌐 All US & Remote (All 5 Regions)</option>
          <option value="midwest">📍 US-Midwest (IL, IN, WI, MN, OH...)</option>
          <option value="west">🌲 US-West (CA, WA, OR, NV...)</option>
          <option value="northeast">🗽 US-Northeast (NY, MA, PA, NJ...)</option>
          <option value="south">☀️ US-South (TX, FL, GA, NC, VA...)</option>
          <option value="mountain">🏔️ US-Mountain (CO, UT, AZ, ID...)</option>
          <option value="remote">🏠 100% Remote US</option>
        </select>
        <select id="state-filter" class="region-select" onchange="applyFilters()">
          <option value="all">🇺🇸 All States (50 States & DC)</option>
          <optgroup label="📍 US-Midwest">
            <option value="IL">Illinois (IL - Chicago)</option>
            <option value="IN">Indiana (IN - Indianapolis, Carmel)</option>
            <option value="WI">Wisconsin (WI - Madison, Milwaukee)</option>
            <option value="MN">Minnesota (MN - Minneapolis)</option>
            <option value="OH">Ohio (OH - Columbus, Cincinnati)</option>
            <option value="MI">Michigan (MI - Detroit, Ann Arbor)</option>
            <option value="MO">Missouri (MO - St. Louis, Kansas City)</option>
            <option value="IA">Iowa (IA - Des Moines)</option>
            <option value="KS">Kansas (KS)</option>
            <option value="NE">Nebraska (NE - Omaha)</option>
          </optgroup>
          <optgroup label="🌲 US-West">
            <option value="CA">California (CA - SF Bay, Silicon Valley, LA)</option>
            <option value="WA">Washington (WA - Seattle, Bellevue)</option>
            <option value="OR">Oregon (OR - Portland)</option>
            <option value="NV">Nevada (NV - Las Vegas)</option>
            <option value="CO">Colorado (CO - Denver, Boulder)</option>
          </optgroup>
          <optgroup label="🗽 US-Northeast">
            <option value="NY">New York (NY - NYC, Brooklyn)</option>
            <option value="MA">Massachusetts (MA - Boston, Cambridge)</option>
            <option value="PA">Pennsylvania (PA - Philadelphia, Pittsburgh)</option>
            <option value="NJ">New Jersey (NJ)</option>
            <option value="CT">Connecticut (CT)</option>
          </optgroup>
          <optgroup label="☀️ US-South">
            <option value="TX">Texas (TX - Austin, Dallas, Houston)</option>
            <option value="FL">Florida (FL - Miami, Tampa, Orlando)</option>
            <option value="GA">Georgia (GA - Atlanta)</option>
            <option value="NC">North Carolina (NC - Raleigh, Charlotte)</option>
            <option value="VA">Virginia (VA - Arlington, Richmond)</option>
            <option value="TN">Tennessee (TN - Nashville)</option>
          </optgroup>
          <optgroup label="🏔️ US-Mountain">
            <option value="UT">Utah (UT - Salt Lake City, Lehi)</option>
            <option value="AZ">Arizona (AZ - Phoenix, Scottsdale)</option>
            <option value="ID">Idaho (ID - Boise)</option>
          </optgroup>
        </select>
      </div>
    </div>

    <div id="tab-jobs" class="tab-content active">
      <!-- Candidate Proactive Notification Banner -->
      <div id="subscription-banner" class="subscription-banner">
        <div class="sub-banner-content">
          <div class="sub-banner-icon">🔔</div>
          <div class="sub-banner-text">
            <strong>Daily Direct-Hire Morning Digest</strong>
            <p id="sub-banner-desc">Receive top 5 curated unlisted jobs automatically via Telegram or query from your AI Agent daily.</p>
          </div>
        </div>
        <div class="sub-banner-actions" id="sub-banner-actions">
          <button class="btn-sub-action" onclick="toggleDashboardSubscription()">⚡ Subscribe via Telegram</button>
        </div>
      </div>

      <div id="jobs-container" class="job-list">
        <p style="color: var(--text-muted); padding: 32px; text-align: center;">Loading gathered tech jobs...</p>
      </div>
      <div id="jobs-pagination" class="pagination-bar"></div>
    </div>

    <div id="tab-companies" class="tab-content">
      <div id="companies-container" class="companies-grid">
        <p style="color: var(--text-muted); padding: 32px; text-align: center; grid-column: 1/-1;">Click to load companies directory...</p>
      </div>
      <div id="companies-pagination" class="pagination-bar"></div>
    </div>

    <!-- Tab 4: Real-time JD Reranking Report & Cloudflare Decision CV Optimizer -->
    <div id="tab-rerank" class="tab-content">
      <!-- Live Real-Time Banner & Stats -->
      <div style="background: linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(168, 85, 247, 0.1)); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px;">
              <span>⚡ Continuous Job Description Reranking</span>
              <span class="status-badge" style="font-size: 11px; padding: 3px 10px;"><span class="status-dot"></span> REAL-TIME EDGE PULSE</span>
            </h3>
            <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;" id="rerank-market-summary">
              Analyzing real-time market demand velocity, freshness decay, and target employer groups.
            </p>
          </div>
          <button onclick="fetchRealtimeRerankReport()" class="region-select" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); cursor: pointer; padding: 8px 16px; font-weight: 600;">
            🔄 Refresh Ranking
          </button>
        </div>

        <!-- Metric Pulse Cards -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--card-border); border-radius: 8px; padding: 12px 16px;">
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Total Analyzed JDs</div>
            <div style="font-size: 22px; font-weight: 700; color: #38bdf8; margin-top: 4px;" id="rerank-stat-total">—</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--card-border); border-radius: 8px; padding: 12px 16px;">
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Top Demanded Stack</div>
            <div style="font-size: 16px; font-weight: 600; color: #a855f7; margin-top: 6px;" id="rerank-stat-top-skill">—</div>
          </div>
          <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--card-border); border-radius: 8px; padding: 12px 16px;">
            <div style="font-size: 11px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Leading Employer Group</div>
            <div style="font-size: 16px; font-weight: 600; color: #34d399; margin-top: 6px;" id="rerank-stat-top-group">—</div>
          </div>
        </div>
      </div>

      <!-- Trending Skills Bar -->
      <div style="background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div style="font-size: 13px; font-weight: 700; color: #e2e8f0; display: flex; align-items: center; gap: 6px;">
            <span>📈 High-Demand Keywords & Skills Velocity Across JDs:</span>
          </div>
          <button onclick="openSyncTagCloudModal()" class="header-btn" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 12px; padding: 4px 12px;">
            ☁️ Compare Market Tag Cloud with My CV
          </button>
        </div>
        <div id="rerank-trending-skills" style="display: flex; flex-wrap: wrap; gap: 8px;">
          <span style="color: var(--text-muted); font-size: 12px;">Loading trending skills...</span>
        </div>
      </div>

      <!-- CV Optimization Tool Section (Decision API) -->
      <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(56, 189, 248, 0.08)); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h4 style="font-size: 16px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px;">
              <span>🎯 Cloudflare Decision API — Multi-Version CV Optimizer</span>
              <span style="font-size: 11px; background: rgba(168, 85, 247, 0.2); color: #c084fc; padding: 2px 8px; border-radius: 6px; font-weight: 600;">AI DECISION ENGINE</span>
            </h4>
            <p style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
              Suggests precise additions and removals into your CV tailored to specific employer target groups.
            </p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 6px;">
              1. Select Target Group (Employer Archetype):
            </label>
            <select id="decision-target-group" class="region-select" style="width: 100%; padding: 10px;">
              <option value="early_stage_startups">🚀 Early-Stage Startups & Stealth (Agility, Full-stack, MVP)</option>
              <option value="scaleups_growth">💎 High-Growth Scale-Ups (Distributed Systems, Scale, CI/CD)</option>
              <option value="ai_first_innovators">🤖 AI-First & LLM Innovators (Workers AI, Agents, MCP, RAG)</option>
              <option value="midwest_regional">🌾 US-Midwest Regional Tech (Chicago, Stability, Clean Code)</option>
              <option value="new_grad_junior">🌱 New Grad & Junior Tech (CS Foundations, Projects, Learning)</option>
              <option value="remote_first_boutique">🏠 Remote-First Boutique Studios (Async, Craftsmanship)</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 6px;">
              2. Use Base CV:
            </label>
            <select id="decision-base-cv" class="region-select" style="width: 100%; padding: 10px;" onchange="onDecisionBaseCvChange()">
              <option value="sample">📝 Standard CV Template (Default)</option>
            </select>
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 12px; font-weight: 600; color: #cbd5e1; margin-bottom: 6px;">
            Current CV Content (Markdown):
          </label>
          <textarea id="decision-cv-content" style="width: 100%; height: 130px; background: rgba(15, 23, 42, 0.8); border: 1px solid var(--card-border); border-radius: 8px; color: #e2e8f0; font-family: 'JetBrains Mono', monospace; font-size: 12px; padding: 10px; resize: vertical;" placeholder="# Jane Doe - Software Engineer&#10;&#10;## Experience&#10;- Software Engineer building web apps...&#10;&#10;## Skills&#10;TypeScript, React, Python, Docker"></textarea>
        </div>

        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
          <button id="btn-run-decision" onclick="runDecisionOptimization()" class="region-select" style="background: linear-gradient(135deg, #38bdf8, #a855f7); color: #fff; font-weight: 700; border: none; padding: 10px 24px; cursor: pointer; border-radius: 8px;">
            ⚡ Analyze & Optimize with Decision API
          </button>
          <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); cursor: pointer;">
            <input type="checkbox" id="decision-save-checkbox" checked /> Automatically save new version to My CVs
          </label>
        </div>

        <!-- Decision Results Container -->
        <div id="decision-results-container" style="display: none; margin-top: 20px; border-top: 1px solid rgba(168, 85, 247, 0.2); padding-top: 20px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 16px;">
            <!-- Match Score Box -->
            <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 10px; padding: 16px;">
              <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Projected Match Score</div>
              <div style="display: flex; align-items: baseline; gap: 10px; margin-top: 8px;">
                <span style="font-size: 28px; font-weight: 800; color: #94a3b8;" id="decision-current-score"></span>
                <span style="font-size: 18px; color: var(--text-muted);">➔</span>
                <span style="font-size: 32px; font-weight: 800; color: #34d399;" id="decision-projected-score"></span>
              </div>
            </div>

            <!-- Strategy Box -->
            <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 10px; padding: 16px;">
              <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase;">Positioning Strategy</div>
              <p style="font-size: 13px; color: #cbd5e1; margin-top: 8px; line-height: 1.5;" id="decision-strategy-text"></p>
            </div>
          </div>

          <!-- Additions & Removals Cards -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <!-- Additions -->
            <div style="background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 16px;">
              <h5 style="color: #34d399; font-size: 14px; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                <span>✅ RECOMMENDED ADDITIONS:</span>
              </h5>
              <div id="decision-additions-list" style="display: flex; flex-direction: column; gap: 10px;"></div>
            </div>

            <!-- Removals -->
            <div style="background: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; padding: 16px;">
              <h5 style="color: #f87171; font-size: 14px; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                <span>❌ RECOMMENDED REMOVALS:</span>
              </h5>
              <div id="decision-removals-list" style="display: flex; flex-direction: column; gap: 10px;"></div>
            </div>
          </div>

          <!-- Optimized CV Preview -->
          <div style="background: rgba(15, 23, 42, 0.7); border: 1px solid var(--card-border); border-radius: 10px; padding: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 13px; font-weight: 700; color: #fff;">📄 Optimized CV Content (Markdown):</span>
              <button onclick="copyOptimizedCv()" class="region-select" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); cursor: pointer; padding: 4px 12px; font-size: 12px;">
                📋 Copy CV Markdown
              </button>
            </div>
            <textarea id="decision-optimized-output" style="width: 100%; height: 180px; background: #0b1120; border: 1px solid var(--card-border); border-radius: 8px; color: #a5f3fc; font-family: 'JetBrains Mono', monospace; font-size: 12px; padding: 10px; resize: vertical;" readonly></textarea>
          </div>
        </div>
      </div>

      <!-- Real-Time Top Ranked JDs Table -->
      <div style="background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <h4 style="font-size: 16px; font-weight: 700; color: #fff;">
            🏆 Real-Time Job Description Leaderboard (Top Micro-Companies)
          </h4>
          <div style="display: flex; gap: 8px;">
            <select id="rerank-group-filter" class="region-select" onchange="onRerankGroupFilterChange()">
              <option value="all">All Target Groups</option>
              <option value="early_stage_startups">🚀 Early-Stage Startups</option>
              <option value="scaleups_growth">💎 Scale-Ups</option>
              <option value="ai_first_innovators">🤖 AI-First Innovators</option>
              <option value="midwest_regional">🌾 US-Midwest Tech</option>
              <option value="new_grad_junior">🌱 New Grad & Junior</option>
              <option value="remote_first_boutique">🏠 Remote Boutique</option>
            </select>
          </div>
        </div>

        <div id="rerank-jobs-container" style="display: flex; flex-direction: column; gap: 12px;">
          <p style="color: var(--text-muted); text-align: center; padding: 24px;">Click to load real-time ranking...</p>
        </div>
      </div>
    </div>

    <div id="tab-telemetry" class="tab-content">
      <div class="log-terminal" id="logs-container">
        <p style="color: var(--text-muted)">Loading telemetry stream...</p>
      </div>
    </div>
  </div>

  <!-- Modal 1: Telegram Bot Login -->
  <div id="modal-login" class="modal-backdrop">
    <div class="modal-content" style="max-width: 480px; text-align: center;">
      <div class="modal-header" style="justify-content: space-between;">
        <h3 style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 22px;">✈️</span> Log in via Telegram Bot
        </h3>
        <button class="modal-close-btn" onclick="closeModal('modal-login')">✕</button>
      </div>

      <p style="font-size: 13px; color: var(--text-muted); margin: 0 0 16px 0; text-align: left; line-height: 1.5;">
        One-click authentication via <strong>Telegram Bot</strong> to automatically receive your free <strong>Personal MCP API Token</strong> (for Cursor, Claude Desktop, Antigravity) and unlock multi-version CV storage tailored per JD.
      </p>

      <!-- Primary Action: Open Bot Button -->
      <div style="margin-bottom: 16px;">
        <a id="tg-bot-link" href="#" target="_blank" rel="noopener noreferrer" class="tg-bot-btn" onclick="onOpenBotClicked()">
          <span style="font-size: 20px;">✈️</span> Open Telegram Bot to Log In
        </a>
      </div>

      <!-- Live Sync Radar Box -->
      <div id="tg-sync-box" class="tg-sync-container">
        <div class="radar-spinner"></div>
        <div>
          <div id="tg-sync-title" style="font-weight: 600; font-size: 13px; color: #38bdf8;">
            Initializing bot connection session...
          </div>
          <div id="tg-sync-subtitle" style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
            After opening the bot, simply press the [Start] button!
          </div>
        </div>
      </div>

      <!-- Divider with QR option -->
      <div style="display: flex; align-items: center; margin: 18px 0 14px 0; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
        <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.08);"></div>
        <span style="padding: 0 10px; color: var(--text-muted);">Or scan the QR code with your phone</span>
        <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.08);"></div>
      </div>

      <div style="display: flex; justify-content: center; margin-bottom: 14px;">
        <div style="background: white; padding: 8px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
          <img id="tg-qr-img" src="" alt="Telegram Login QR Code" style="width: 140px; height: 140px; display: block;" />
        </div>
      </div>

      <!-- Instant 1-click Demo / Test Fallback -->
      <div style="padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11px; color: var(--text-muted);">Can't access Telegram right now?</span>
        <button onclick="quickDemoLogin()" class="quick-demo-btn" id="btn-quick-demo">
          ⚡ One-click Demo Login
        </button>
      </div>
    </div>
  </div>

  <!-- Modal 2: MCP Server Configuration -->
  <div id="modal-mcp" class="modal-backdrop">
    <div class="modal-content" style="max-width: 720px;">
      <div class="modal-header">
        <h3><span>🔌</span> Your Personal MCP Server Config</h3>
        <button class="modal-close-btn" onclick="closeModal('modal-mcp')">✕</button>
      </div>
      <p style="font-size: 13px; color: var(--text-muted);">
        Connect OffRadarJob as a Model Context Protocol (MCP) server directly into <strong>Cursor</strong>, <strong>Claude Desktop</strong>, <strong>Antigravity</strong>, or <strong>Windsurf</strong>. Query live unlisted jobs and tailor your CVs in conversation!
      </p>
      
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-size: 12px; font-weight: 600; color: #cbd5e1;">Your MCP Endpoint (HTTP POST / SSE):</label>
        <div class="code-snippet" id="mcp-endpoint-box">
          <button class="copy-chip-btn" onclick="copySnippet('mcp-endpoint-val')">Copy</button>
          <span id="mcp-endpoint-val">https://off-radar-jobs.tuannx87.workers.dev/mcp</span>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-size: 12px; font-weight: 600; color: #cbd5e1;">Your Secret API Bearer Token:</label>
        <div class="code-snippet" id="mcp-token-box">
          <button class="copy-chip-btn" onclick="copySnippet('mcp-token-val')">Copy</button>
          <span id="mcp-token-val">orp_...</span>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-size: 12px; font-weight: 600; color: #cbd5e1;">1-Click Cursor Configuration (<code>.cursor/mcp.json</code>):</label>
        <div class="code-snippet" id="mcp-cursor-snippet">
          <button class="copy-chip-btn" onclick="copySnippet('cursor-json-val')">Copy JSON</button>
          <span id="cursor-json-val"></span>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-size: 12px; font-weight: 600; color: #cbd5e1;">Claude Desktop Config (<code>claude_desktop_config.json</code> via mcp-proxy):</label>
        <div class="code-snippet" id="mcp-claude-snippet">
          <button class="copy-chip-btn" onclick="copySnippet('claude-json-val')">Copy JSON</button>
          <span id="claude-json-val"></span>
        </div>
      </div>

      <div style="background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 8px; padding: 12px; font-size: 12px; color: #d8b4fe; line-height: 1.6;">
        <strong>9 Enabled AI Tools & Daily Briefing Prompts</strong>: <code>search_jobs</code>, <code>get_job_details</code>, <code>list_companies</code>, <code>list_user_cvs</code>, <code>tailor_cv_for_job</code>, <code>save_cv_version</code>, <code>submit_llm_feedback</code>, <span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 6px; border-radius: 4px; font-weight: 700;">🌅 get_daily_digest</span>, and <span style="background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 2px 6px; border-radius: 4px; font-weight: 700;">🔔 manage_job_subscription</span>.
      </div>

      <!-- AI System Prompt & Proactive Feedback Protocol -->
      <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <label style="font-size: 12px; font-weight: 600; color: #38bdf8;">🤖 Recommended AI System Prompt (Cursor / Claude / Antigravity / Windsurf):</label>
          <span style="font-size: 11px; color: var(--text-muted);">Enables Proactive Feedback Protocol</span>
        </div>
        <div class="code-snippet" style="max-height: 160px; overflow-y: auto;">
          <button class="copy-chip-btn" onclick="copySnippet('mcp-prompt-val')">Copy Prompt</button>
          <pre id="mcp-prompt-val" style="white-space: pre-wrap; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #cbd5e1; margin: 0;"></pre>
        </div>
      </div>

      <!-- Interactive LLM Feedback & Signal History -->
      <div style="background: #0b1120; border: 1px solid var(--card-border); border-radius: 8px; padding: 14px; margin-top: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="font-size: 13px; font-weight: 600; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
            <span>💡</span> Proactive Signals Sent by Your AI
          </h4>
          <button class="copy-chip-btn" style="position: static; font-size: 11px; padding: 3px 8px;" onclick="loadUserFeedbacks()">🔄 Refresh</button>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 10px;">
          When your AI agent detects broken links, candidate skill shortages, or unlisted startup opportunities, it proactively logs feedback here.
        </p>
        <div id="user-feedbacks-container" style="max-height: 140px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
          <div style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 8px;">Loading feedback signals...</div>
        </div>

        <!-- Quick Direct Feedback Form -->
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed rgba(255, 255, 255, 0.1);">
          <div style="display: flex; gap: 8px; align-items: center;">
            <select id="user-quick-fb-type" style="background: #131b2e; border: 1px solid var(--card-border); color: #cbd5e1; padding: 6px 10px; border-radius: 6px; font-size: 12px;">
              <option value="broken_link">🚨 Broken Link</option>
              <option value="user_preference">🎯 Missing Role/Skill</option>
              <option value="job_relevance">📋 Job Relevance</option>
              <option value="general_suggestion">💡 Suggestion</option>
            </select>
            <input type="text" id="user-quick-fb-text" placeholder="Share quick feedback with the OffRadar team..." style="flex: 1; background: #131b2e; border: 1px solid var(--card-border); color: #fff; padding: 6px 12px; border-radius: 6px; font-size: 12px;" />
            <button onclick="submitQuickUserFeedback()" class="header-btn-primary" style="padding: 6px 12px; font-size: 12px; white-space: nowrap;">Send</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal 3: My Stored CV Versions -->
  <div id="modal-my-cvs" class="modal-backdrop">
    <div class="modal-content" style="max-width: 740px;">
      <div class="modal-header">
        <h3><span>📄</span> My CV Versions</h3>
        <button class="modal-close-btn" onclick="closeModal('modal-my-cvs')">✕</button>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
        <p style="font-size: 13px; color: var(--text-muted); margin: 0;">
          Manage master CVs, customized versions, and analyze <strong>Tag Clouds</strong> synchronized with employer JDs.
        </p>
        <div style="display: flex; gap: 8px;">
          <button onclick="toggleImportCvSection()" class="header-btn" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">📁 Import File CV</button>
          <button onclick="toggleNewCvForm()" class="header-btn">+ Add New CV</button>
        </div>
      </div>

      <!-- Import CV File Section (hidden by default) -->
      <div id="cv-import-section" style="display: none; background: #0b1120; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 10px; padding: 16px; flex-direction: column; gap: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h4 style="font-size: 14px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 6px;">
            <span>📁</span> Import Document & Synchronized Tag Cloud Analysis
          </h4>
          <span style="font-size: 11px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 8px; border-radius: 6px;">PDF • DOCX • TXT • MD • JSON</span>
        </div>
        <p style="font-size: 12px; color: var(--text-muted); margin: 0;">
          Drag & drop your resume file or browse to extract skills, compute weights, and display a synchronized Tag Cloud.
        </p>

        <!-- Dropzone -->
        <div id="cv-file-dropzone" class="file-dropzone" onclick="document.getElementById('cv-file-input').click()" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event)">
          <div style="font-size: 32px; margin-bottom: 8px;">📄</div>
          <div style="font-size: 13px; font-weight: 600; color: #e2e8f0;" id="dropzone-label">
            Drop your CV file here or <span style="color: var(--primary); text-decoration: underline;">click to browse</span>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
            Supports PDF, Microsoft Word (.docx), Markdown (.md), Plain Text (.txt), and JSON (.json)
          </div>
          <input type="file" id="cv-file-input" accept=".pdf,.docx,.txt,.md,.json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,application/json" onchange="handleCvFileChosen(event)" />
        </div>

        <div id="selected-file-badge" style="display: none; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 8px 12px; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">📎</span>
            <div>
              <div id="selected-file-name" style="font-size: 13px; font-weight: 600; color: #fff;"></div>
              <div id="selected-file-size" style="font-size: 11px; color: var(--text-muted);"></div>
            </div>
          </div>
          <button onclick="clearSelectedCvFile()" style="background: transparent; border: none; color: #f87171; cursor: pointer; font-size: 16px;">✕</button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label style="font-size: 11px; font-weight: 600; color: #cbd5e1; display: block; margin-bottom: 4px;">CV Version Title (optional):</label>
            <input type="text" id="import-cv-title" placeholder="e.g. Master Fullstack 2026" style="width: 100%;" />
          </div>
          <div>
            <label style="font-size: 11px; font-weight: 600; color: #cbd5e1; display: block; margin-bottom: 4px;">Target Role (optional):</label>
            <input type="text" id="import-cv-role" placeholder="e.g. Senior Backend Engineer" style="width: 100%;" />
          </div>
        </div>

        <div>
          <label style="font-size: 11px; font-weight: 600; color: #cbd5e1; display: block; margin-bottom: 4px;">Target Employer Group Archetype:</label>
          <select id="import-cv-target-group" class="region-select" style="width: 100%;">
            <option value="early_stage_startups">🚀 Early-Stage Startups & Stealth (Agility, MVP, Fullstack)</option>
            <option value="scaleups_growth">📈 Scale-ups & Growth Tech (Microservices, Reliability, Scale)</option>
            <option value="ai_first_innovators">🤖 DeepTech & AI-First Innovators (PyTorch, LLM, Agents, RAG)</option>
            <option value="midwest_regional">🌾 Midwest Regional Hubs (Boutique, Long-term, High Impact)</option>
            <option value="new_grad_junior">🌱 High-Potential Junior & New Grad (Core Foundations)</option>
            <option value="remote_first_boutique">🌍 Remote-First Boutique Micro-Companies (Asynchronous)</option>
          </select>
        </div>

        <div style="display: flex; gap: 8px; justify-content: flex-end; align-items: center; margin-top: 4px;">
          <button onclick="toggleImportCvSection()" class="header-btn-secondary">Close</button>
          <button id="btn-upload-import-cv" onclick="uploadAndAnalyzeCvFile()" class="header-btn-primary" style="background: linear-gradient(135deg, #0284c7, #9333ea);">
            ⚡ Upload & Extract Tag Cloud
          </button>
        </div>

        <!-- Import Result Preview Box -->
        <div id="import-result-preview" style="display: none; background: #060911; border: 1px solid var(--card-border); border-radius: 8px; padding: 12px; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; font-weight: 700; color: #34d399;" id="import-result-title">✅ Tag Cloud Analyzed Successfully</span>
            <span style="font-size: 11px; color: var(--text-muted);" id="import-result-stats"></span>
          </div>
          <div id="import-result-tags" class="tag-cloud-wrapper" style="max-height: 120px; overflow-y: auto; padding: 4px 0;"></div>
          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px;">
            <button id="btn-open-sync-from-import" class="header-btn" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 12px;">
              ☁️ Open Synchronized Tag Cloud Studio
            </button>
          </div>
        </div>
      </div>

      <!-- New CV Form (hidden by default) -->
      <div id="new-cv-form" style="display: none; background: #0b1120; border: 1px solid var(--card-border); border-radius: 10px; padding: 16px; flex-direction: column; gap: 10px;">
        <h4 style="font-size: 14px; font-weight: 600; color: #fff;">Add New CV Version</h4>
        <input type="text" id="new-cv-title" placeholder="CV Title (e.g. Master Backend CV, AI Engineer CV)" />
        <input type="text" id="new-cv-role" placeholder="Target Role (e.g. Senior Backend Engineer)" />
        <input type="text" id="new-cv-skills" placeholder="Skills (comma separated, e.g. Go, Rust, PostgreSQL, Cloudflare)" />
        <textarea id="new-cv-content" rows="6" placeholder="# John Doe - Resume&#10;&#10;## Experience&#10;- Built distributed systems..." style="background: #060911; border: 1px solid var(--card-border); color: #fff; padding: 10px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 12px;"></textarea>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button onclick="toggleNewCvForm()" class="header-btn-secondary">Cancel</button>
          <button onclick="saveNewCv()" class="header-btn-primary">Save CV</button>
        </div>
      </div>

      <div id="my-cvs-list" style="display: flex; flex-direction: column; gap: 12px;">
        <p style="color: var(--text-muted); text-align: center; padding: 20px;">Loading your CVs...</p>
      </div>
    </div>
  </div>

  <!-- Modal 4: Tailor CV for Job -->
  <div id="modal-tailor" class="modal-backdrop">
    <div class="modal-content" style="max-width: 760px;">
      <div class="modal-header">
        <h3><span>✨</span> AI-Tailored CV for Job</h3>
        <button class="modal-close-btn" onclick="closeModal('modal-tailor')">✕</button>
      </div>

      <div style="background: #0b1120; border: 1px solid var(--card-border); border-radius: 10px; padding: 14px;">
        <div style="font-size: 16px; font-weight: 700; color: #fff;" id="tailor-target-title">Software Engineer</div>
        <div style="font-size: 13px; color: var(--primary); margin-top: 2px;" id="tailor-target-company">Acme Corp</div>
        <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;" id="tailor-target-skills"></div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-size: 12px; font-weight: 600; color: #cbd5e1;">Select Base CV:</label>
        <select id="tailor-base-cv-select" class="region-select" onchange="onTailorBaseCvChange()" style="width: 100%;">
          <option value="">-- Use Default Tech CV Template --</option>
        </select>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <label style="font-size: 12px; font-weight: 600; color: #cbd5e1;">CV Content to Match & Tailor (Markdown):</label>
        <textarea id="tailor-cv-content" rows="6" style="background: #0b1120; border: 1px solid var(--card-border); color: #fff; padding: 10px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 12px;"></textarea>
      </div>

      <button id="btn-execute-tailor" onclick="executeTailorCv()" class="tailor-btn" style="justify-content: center; padding: 12px; font-size: 14px;">
        ⚡ Analyze JD Match & Generate Tailored CV
      </button>

      <!-- Tailor Result Area (hidden initially) -->
      <div id="tailor-result-area" style="display: none; flex-direction: column; gap: 14px; border-top: 1px solid var(--card-border); padding-top: 16px;">
        <div class="score-meter">
          <span style="font-size: 13px; font-weight: 700; color: #cbd5e1;">JD Keyword Match Score:</span>
          <div class="score-meter-bar">
            <div id="tailor-score-fill" class="score-meter-fill" style="width: 0%; background: #10b981;"></div>
          </div>
          <span id="tailor-score-text" style="font-size: 16px; font-weight: 800; color: #10b981;">0%</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="background: rgba(16, 185, 129, 0.06); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 8px; padding: 10px;">
            <div style="font-size: 12px; font-weight: 600; color: #34d399; margin-bottom: 6px;">✅ Matched Skills</div>
            <div id="tailor-matched-skills" style="display: flex; flex-wrap: wrap; gap: 6px;"></div>
          </div>
          <div style="background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 8px; padding: 10px;">
            <div style="font-size: 12px; font-weight: 600; color: #fbbf24; margin-bottom: 6px;">⚠️ Missing Skills in CV</div>
            <div id="tailor-missing-skills" style="display: flex; flex-wrap: wrap; gap: 6px;"></div>
          </div>
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 600; color: #cbd5e1; display: block; margin-bottom: 4px;">Tailored Executive Summary:</label>
          <div id="tailor-suggested-summary" style="background: #0b1120; border: 1px solid var(--card-border); border-radius: 8px; padding: 10px; font-size: 13px; color: #e2e8f0; line-height: 1.5;"></div>
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 600; color: #cbd5e1; display: block; margin-bottom: 4px;">Tailored Markdown CV Ready for Application:</label>
          <textarea id="tailor-final-markdown" rows="8" style="width: 100%; background: #060911; border: 1px solid var(--card-border); color: #93c5fd; padding: 10px; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 12px;"></textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button onclick="copySnippet('tailor-final-markdown')" class="header-btn">📋 Copy Markdown</button>
          <button id="btn-save-tailored-cv" onclick="saveTailoredCv()" class="header-btn-primary">💾 Save as Tailored CV Version</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal 5: Synchronized Tag Cloud Studio (CV vs JD / Market) -->
  <div id="modal-sync-tag-cloud" class="modal-backdrop">
    <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header">
        <h3 style="display: flex; align-items: center; gap: 8px;">
          <span>☁️</span> Synchronized Tag Cloud Studio
          <span style="font-size: 11px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 8px; border-radius: 6px; font-weight: 600;">CV vs JD DEMAND</span>
        </h3>
        <button class="modal-close-btn" onclick="closeModal('modal-sync-tag-cloud')">✕</button>
      </div>

      <!-- Controls: CV Selector & Target Mode -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #0b1120; border: 1px solid var(--card-border); border-radius: 10px; padding: 14px;">
        <div>
          <label style="font-size: 12px; font-weight: 600; color: #cbd5e1; display: block; margin-bottom: 6px;">📄 CV Version to Analyze:</label>
          <select id="sync-cv-select" class="region-select" style="width: 100%;" onchange="onSyncCvSelectionChange()">
            <!-- Populated dynamically -->
          </select>
        </div>
        <div>
          <label style="font-size: 12px; font-weight: 600; color: #cbd5e1; display: block; margin-bottom: 6px;">🎯 Comparison Target (JD / Archetype / Market):</label>
          <select id="sync-target-select" class="region-select" style="width: 100%;" onchange="runSynchronizedTagCloudComparison()">
            <optgroup label="🌐 Comprehensive Tech Market">
              <option value="market">Real-time Off-Radar Tech Market Index (All JDs)</option>
            </optgroup>
            <optgroup label="🏢 Target Group Archetype">
              <option value="group:early_stage_startups">🚀 Early-Stage Startups & Stealth (Agility, Full-stack, MVP)</option>
              <option value="group:scaleups_growth">📈 Scale-ups & Growth Tech (Reliability, Scale, Microservices)</option>
              <option value="group:ai_first_innovators">🤖 DeepTech & AI-First Innovators (LLMs, RAG, PyTorch)</option>
              <option value="group:midwest_regional">🌾 Midwest Regional Tech Hubs (Boutique, Long-term Value)</option>
              <option value="group:new_grad_junior">🌱 High-Potential Junior & New Grad (Core CS Fundamentals)</option>
              <option value="group:remote_first_boutique">🌍 Remote-First Boutique Micro-Companies (Asynchronous)</option>
            </optgroup>
            <optgroup id="sync-target-jobs-group" label="💼 Specific Open Job Descriptions">
              <!-- Populated dynamically -->
            </optgroup>
          </select>
        </div>
      </div>

      <!-- Live Match Score Meter Banner -->
      <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(56, 189, 248, 0.1)); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 12px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div style="flex: 1; min-width: 240px;">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <span style="font-size: 12px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Skill Compatibility</span>
            <span id="sync-weighted-badge" style="font-size: 11px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 8px; border-radius: 6px; font-weight: 700;">Weighted Fit: --%</span>
            <span id="sync-ats-badge" style="font-size: 11px; background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); padding: 2px 8px; border-radius: 6px; font-weight: 700;">ATS: --/100</span>
          </div>
          <div style="display: flex; align-items: baseline; gap: 12px; margin-top: 4px;">
            <span style="font-size: 32px; font-weight: 800; color: #34d399;" id="sync-match-score">0%</span>
            <span style="font-size: 13px; font-weight: 600; color: #cbd5e1;" id="sync-match-rating">Calculating...</span>
          </div>
          <div class="score-meter-bar" style="margin-top: 8px; height: 8px;">
            <div id="sync-score-meter-fill" class="score-meter-fill" style="width: 0%; background: #10b981;"></div>
          </div>
        </div>

        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <button onclick="runSynchronizedTagCloudComparison()" class="header-btn" style="padding: 8px 14px; font-size: 13px;">🔄 Re-analyze</button>
          <button onclick="triggerDecisionOptimizerFromSync()" class="header-btn-primary" style="background: linear-gradient(135deg, #a855f7, #38bdf8); padding: 8px 14px; font-size: 13px;">
            ⚡ Optimize with Decision API
          </button>
        </div>
      </div>

      <!-- Actionable Strategic Recommendation Box -->
      <div id="sync-recommendation-box" style="display: none; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #e2e8f0; line-height: 1.5;">
        <strong style="color: #38bdf8;">💡 Strategic Recommendation:</strong> <span id="sync-recommendation-summary"></span>
      </div>

      <!-- Category Breakdown Pills -->
      <div id="sync-category-breakdown-bar" style="display: flex; flex-wrap: wrap; gap: 8px; background: #0b1120; border: 1px solid var(--card-border); border-radius: 8px; padding: 10px 14px; align-items: center;">
        <span style="font-size: 11px; color: var(--text-muted);">Skill Category Breakdown: Calculating...</span>
      </div>

      <!-- 4-Box Matrix of Tag Clouds -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <!-- Box 1: 🟢 Matched Skills -->
        <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 13px; font-weight: 700; color: #34d399; display: flex; align-items: center; gap: 6px;">
              <span>✅</span> Perfect Skill Matches (<span id="count-matched-tags">0</span>)
            </div>
            <span style="font-size: 10px; color: #6ee7b7; text-transform: uppercase;">CV & JD Match</span>
          </div>
          <p style="font-size: 11px; color: var(--text-muted); margin: 0;">
            Skills present simultaneously in your CV and required by the target JD.
          </p>
          <div id="sync-matched-tags" class="tag-cloud-wrapper" style="min-height: 80px;"></div>
        </div>

        <!-- Box 2: 🟡 Missing High-Demand Skills -->
        <div style="background: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 13px; font-weight: 700; color: #fbbf24; display: flex; align-items: center; gap: 6px;">
              <span>⚠️</span> High-Demand Missing Skills (<span id="count-missing-tags">0</span>)
            </div>
            <span style="font-size: 10px; color: #fcd34d; text-transform: uppercase;">Action Needed</span>
          </div>
          <p style="font-size: 11px; color: var(--text-muted); margin: 0;">
            Skills demanded by JD but missing in CV. Click <strong>+ Add</strong> to inject directly into your CV!
          </p>
          <div id="sync-missing-tags" class="tag-cloud-wrapper" style="min-height: 80px;"></div>
        </div>

        <!-- Box 3: ⚪ CV Superpowers / Unique Breadth -->
        <div style="background: rgba(56, 189, 248, 0.05); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 13px; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
              <span>⭐</span> Unique CV Strengths (<span id="count-cv-only-tags">0</span>)
            </div>
            <span style="font-size: 10px; color: #93c5fd; text-transform: uppercase;">CV Superpowers</span>
          </div>
          <p style="font-size: 11px; color: var(--text-muted); margin: 0;">
            Distinctive strengths you possess beyond the JD requirements, giving you a competitive edge.
          </p>
          <div id="sync-cv-only-tags" class="tag-cloud-wrapper" style="min-height: 80px;"></div>
        </div>

        <!-- Box 4: 🔴 Deprecated / Legacy Tech -->
        <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 13px; font-weight: 700; color: #f87171; display: flex; align-items: center; gap: 6px;">
              <span>🚫</span> Legacy Tech to Prune (<span id="count-deprecated-tags">0</span>)
            </div>
            <span style="font-size: 10px; color: #fca5a5; text-transform: uppercase;">Legacy Flag</span>
          </div>
          <p style="font-size: 11px; color: var(--text-muted); margin: 0;">
            Obsolete technologies (jQuery, SVN, PHP 5...) that may detract from modern engineering evaluation.
          </p>
          <div id="sync-deprecated-tags" class="tag-cloud-wrapper" style="min-height: 80px;"></div>
        </div>
      </div>
    </div>
  </div>

  <script>
    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    let currentJobsPage = 1;
    let currentCompsPage = 1;
    let jobsPagination = { page: 1, limit: 30, total: 0, totalPages: 1 };
    let compsPagination = { page: 1, limit: 30, total: 0, totalPages: 1 };
    let searchDebounceTimer = null;
    let companiesLoaded = false;

    async function loadData() {
      try {
        fetchStats();
        await fetchJobs(1);
      } catch (err) {
        console.error('Error in loadData:', err);
      }
    }

    async function fetchStats() {
      try {
        const stats = await fetch('/api/stats').then(r => r.json());
        if (!stats) return;
        // Only show counters once real data exists; never show placeholder 0 or 100%.
        const fmt = (n) => (typeof n === 'number' && n > 0) ? n.toLocaleString('en-US') : '';
        const setText = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };
        if (stats.jobsCount > 0) {
          const rb = stats.regionalBreakdown || {};
          setText('stat-companies', fmt(stats.companiesCount));
          setText('stat-jobs', fmt(stats.jobsCount));
          setText('stat-senior', fmt(stats.seniorCount));
          setText('stat-midwest', (rb.midwest > 0 && typeof stats.midwestPercent === 'number') ? stats.midwestPercent + '%' : '');
          setText('stat-reg-all', fmt(stats.jobsCount));
          setText('stat-reg-midwest', fmt(rb.midwest));
          setText('stat-reg-west', fmt(rb.west));
          setText('stat-reg-northeast', fmt(rb.northeast));
          setText('stat-reg-south', fmt(rb.south));
          setText('stat-reg-mountain', fmt(rb.mountain));
          const grid = document.getElementById('stats-grid');
          if (grid) grid.hidden = false;
        }
        renderLogs(stats.recentLogs || []);
      } catch (err) {
        console.warn('Stats fetch error:', err);
      }
    }

    function onSearchInput() {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        fetchJobs(1);
        if (companiesLoaded) {
          fetchCompanies(1);
        }
      }, 300);
    }

    function setRegionFilter(region) {
      const select = document.getElementById('region-filter');
      if (select) {
        select.value = region;
      }
      applyFilters();
    }

    function toggleNewGradFilter() {
      const gradeSelect = document.getElementById('grade-filter');
      if (!gradeSelect) return;
      if (gradeSelect.value === 'new_grad') {
        gradeSelect.value = 'all';
      } else {
        gradeSelect.value = 'new_grad';
      }
      applyFilters();
    }

    function applyFilters() {
      const region = document.getElementById('region-filter')?.value || 'all';
      const grade = document.getElementById('grade-filter')?.value || 'all';
      document.querySelectorAll('.region-pill').forEach(el => el.classList.remove('active'));
      const activePill = document.getElementById('pill-' + region);
      if (activePill) activePill.classList.add('active');

      const ngBtn = document.getElementById('quick-newgrad-btn');
      if (ngBtn) {
        if (grade === 'new_grad') {
          ngBtn.style.background = '#10b981';
          ngBtn.style.borderColor = '#10b981';
          ngBtn.style.color = '#ffffff';
          ngBtn.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.4)';
        } else {
          ngBtn.style.background = 'rgba(16, 185, 129, 0.15)';
          ngBtn.style.borderColor = 'rgba(16, 185, 129, 0.4)';
          ngBtn.style.color = '#34d399';
          ngBtn.style.boxShadow = 'none';
        }
      }

      fetchJobs(1);
      if (companiesLoaded) {
        fetchCompanies(1);
      }
    }

    async function fetchJobs(page = 1) {
      currentJobsPage = page;
      const container = document.getElementById('jobs-container');
      const region = document.getElementById('region-filter').value;
      const grade = document.getElementById('grade-filter').value;
      const tech = document.getElementById('tech-filter').value;
      const search = (document.getElementById('search-input')?.value || '').trim();

      container.innerHTML = '<p style="color: var(--text-muted); padding: 32px; text-align: center;">⚡ Loading jobs (page ' + page + ')...</p>';

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: '30',
          paged: 'true',
        });
        if (grade !== 'all') params.set('grade', grade);
        if (tech !== 'all') params.set('tech_category', tech);
        if (region !== 'all') params.set('region', region);
        const state = document.getElementById('state-filter')?.value;
        if (state && state !== 'all') params.set('state', state);
        if (search) params.set('search', search);

        const res = await fetch('/api/jobs?' + params.toString());
        const data = await res.json();

        const jobs = data.items || (Array.isArray(data) ? data : []);
        jobsPagination = data.pagination || {
          page,
          limit: 30,
          total: jobs.length,
          totalPages: Math.ceil(jobs.length / 30) || 1
        };

        renderJobsList(jobs);
        renderPagination('jobs-pagination', jobsPagination, 'changeJobsPage');
      } catch (err) {
        container.innerHTML = '<p style="color: var(--danger); padding: 32px; text-align: center;">Error loading jobs: ' + err.message + '</p>';
      }
    }

    function changeJobsPage(page) {
      fetchJobs(page);
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }

    function getRegionBadge(j) {
      const reg = j.usRegion || (j.isMidwest ? 'midwest' : (j.isRemote ? 'remote' : 'other'));
      switch(reg) {
        case 'midwest': return '<span class="tag tag-midwest">📍 US-Midwest</span>';
        case 'west': return '<span class="tag tag-west">🌲 US-West</span>';
        case 'northeast': return '<span class="tag tag-northeast">🗽 US-Northeast</span>';
        case 'south': return '<span class="tag tag-south">☀️ US-South</span>';
        case 'mountain': return '<span class="tag tag-mountain">🏔️ US-Mountain</span>';
        case 'remote': return '<span class="tag tag-remote">🌐 100% Remote US</span>';
        default: return '';
      }
    }

    function renderJobsList(jobs) {
      const container = document.getElementById('jobs-container');
      if (!jobs || jobs.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); padding: 32px; text-align: center;">No off-radar tech jobs matched your query. Try adjusting your search or filters.</p>';
        return;
      }

      container.innerHTML = jobs.map(j => {
        const isMidwest = j.isMidwest || j.usRegion === 'midwest' || (j.remoteScope && j.remoteScope.toLowerCase().includes('midwest')) || (j.location && /\b(IL|IN|WI|MN|OH|MI|MO|IA|KS|NE|ND|SD|Chicago|Indianapolis|Minneapolis|Madison|Cincinnati|Columbus|Cleveland|Detroit|Ann Arbor|Midwest)\b/i.test(j.location));
        return \`
          <div class="job-card \${isMidwest ? 'job-card-midwest' : ''}">
            <div class="job-main">
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <h3>\${j.title}</h3>
                \${getGradeBadge(j.seniorityLevel)}
                \${getTechBadge(j.techCategory)}
                \${getRegionBadge(j)}
              </div>
              <a class="job-company" href="\${j.companyWebsite || ('https://' + j.companyId.replace('comp_', '').replace(/_/g, '.'))}" target="_blank">🏢 \${j.companyName || j.companyId.replace('comp_', '').replace(/_/g, '.')} ↗</a>
              <p class="job-desc">\${j.descriptionSummary || 'Direct tech opening from micro-company career portal.'}</p>
              <div class="job-tags">
                <span class="tag tag-remote">🌐 \${j.isRemote ? 'Remote (' + j.remoteScope + ')' : j.location}</span>
                <span class="tag">\${j.employmentType}</span>
                \${j.salaryMin ? \`<span class="tag tag-salary">\\$\${j.salaryMin.toLocaleString()} - \\$\${j.salaryMax.toLocaleString()} \${j.salaryCurrency || 'USD'}</span>\` : ''}
                \${(j.skills || []).map(s => \`<span class="tag">\${s}</span>\`).join('')}
                <span class="tag tag-verified" title="Apply link last verified / last seen by the crawler">✓ Last verified \${new Date(j.lastVerifiedAt || j.lastSeenAt).toISOString().slice(0, 10)}</span>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-end;">
              <a class="apply-btn" href="\${j.applyType === 'email' ? 'mailto:' + j.applyTarget : j.applyTarget}" target="_blank">
                Apply via \${j.applyType.toUpperCase()} ↗
              </a>
              <button class="tailor-btn" onclick="openCvTailorModal('\${j.id}', '\${encodeURIComponent(j.title || '')}', '\${encodeURIComponent(j.companyName || j.companyId || '')}', '\${encodeURIComponent((j.skills || []).join(','))}')">
                ✨ Tailor CV
              </button>
            </div>
          </div>
        \`;
      }).join('');
    }

    async function fetchCompanies(page = 1) {
      currentCompsPage = page;
      const container = document.getElementById('companies-container');
      container.innerHTML = '<p style="color: var(--text-muted); padding: 32px; text-align: center; grid-column: 1/-1;">⚡ Loading micro-companies (page ' + page + ')...</p>';

      try {
        const region = document.getElementById('region-filter')?.value;
        const state = document.getElementById('state-filter')?.value;
        const stage = document.getElementById('stage-filter')?.value;
        const dept = document.getElementById('dept-filter')?.value;
        const search = (document.getElementById('search-input')?.value || '').trim();

        let compUrl = '/api/companies?page=' + page + '&limit=30&paged=true';
        if (region && region !== 'all') compUrl += '&region=' + encodeURIComponent(region);
        if (state && state !== 'all') compUrl += '&state=' + encodeURIComponent(state);
        if (stage && stage !== 'all') compUrl += '&funding_stage=' + encodeURIComponent(stage);
        if (dept && dept !== 'all') compUrl += '&primary_department=' + encodeURIComponent(dept);
        if (search) compUrl += '&search=' + encodeURIComponent(search);

        const res = await fetch(compUrl);
        const data = await res.json();

        const comps = data.items || (Array.isArray(data) ? data : []);
        compsPagination = data.pagination || {
          page,
          limit: 30,
          total: comps.length,
          totalPages: Math.ceil(comps.length / 30) || 1
        };
        companiesLoaded = true;

        renderCompaniesList(comps);
        renderPagination('companies-pagination', compsPagination, 'changeCompsPage');
      } catch (err) {
        container.innerHTML = '<p style="color: var(--danger); padding: 32px; text-align: center; grid-column: 1/-1;">Error loading companies: ' + err.message + '</p>';
      }
    }

    function changeCompsPage(page) {
      fetchCompanies(page);
      window.scrollTo({ top: 350, behavior: 'smooth' });
    }

    function getCompanyFundingBadge(c) {
      const stage = c.fundingStage;
      const funding = c.totalFunding;
      const val = c.valuationEstimate;
      if (!stage && !funding && !val) return '';

      let label = '';
      let style = 'background: rgba(168, 85, 247, 0.15); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.3);';

      if (stage === 'bootstrapped') {
        label = '🪙 Bootstrapped';
        style = 'background: rgba(16, 185, 129, 0.15); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.3);';
      } else if (stage === 'seed') {
        label = '🌱 Seed' + (funding ? ' (' + funding + ')' : '');
        style = 'background: rgba(56, 189, 248, 0.15); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.3);';
      } else if (stage === 'series_a') {
        label = '🚀 Series A' + (funding ? ' (' + funding + ')' : '');
        style = 'background: rgba(168, 85, 247, 0.15); color: #d8b4fe; border: 1px solid rgba(168, 85, 247, 0.3);';
      } else if (stage === 'series_b') {
        label = '📈 Series B' + (funding ? ' (' + funding + ')' : '');
        style = 'background: rgba(244, 63, 94, 0.15); color: #fda4af; border: 1px solid rgba(244, 63, 94, 0.3);';
      } else if (stage === 'growth') {
        label = '🦄 Growth' + (val ? ' (' + val + ')' : (funding ? ' (' + funding + ')' : ''));
        style = 'background: rgba(245, 158, 11, 0.15); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.3);';
      } else if (stage === 'acquired' || stage === 'public') {
        label = '🏛️ ' + (stage === 'acquired' ? 'Acquired' : 'Public');
        style = 'background: rgba(148, 163, 184, 0.15); color: #cbd5e1; border: 1px solid rgba(148, 163, 184, 0.3);';
      } else if (funding || val) {
        label = '💰 ' + (val || funding);
      }

      return label ? '<span class="tag" style="' + style + '; font-weight: 600;">' + label + '</span>' : '';
    }

    function renderDepartmentWeightsBar(c) {
      let depts = c.hiringDepartments;
      if (!depts && c.hiringDepartmentsJson) {
        try {
          depts = JSON.parse(c.hiringDepartmentsJson);
        } catch (_) {}
      }
      if (!depts || Object.keys(depts).length === 0) {
        if (c.primaryDepartment) {
          return '<div style="font-size: 11px; color: #94a3b8; margin-top: 8px;">🏢 Dominant Hiring: <strong style="color: #38bdf8;">' + c.primaryDepartment + '</strong></div>';
        }
        return '';
      }

      const deptColors = {
        'Engineering': '#38bdf8',
        'Product & Design': '#a855f7',
        'Growth & Marketing': '#f59e0b',
        'Sales': '#10b981',
        'Operations & Support': '#64748b',
        'Finance & Legal': '#ec4899',
        'People & HR': '#06b6d4',
        'General': '#94a3b8'
      };

      const entries = Object.entries(depts).sort((a, b) => b[1].percentage - a[1].percentage);
      const segments = entries.map(([dept, m]) => {
        const color = deptColors[dept] || '#38bdf8';
        return '<div style="width: ' + m.percentage + '%; background-color: ' + color + '; height: 6px;" title="' + dept + ': ' + m.percentage + '% (' + m.count + ' roles)"></div>';
      }).join('');

      const badges = entries.slice(0, 3).map(([dept, m]) => {
        const color = deptColors[dept] || '#38bdf8';
        return '<span style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #cbd5e1;">' +
          '<span style="width: 6px; height: 6px; border-radius: 50%; background-color: ' + color + ';"></span>' +
          dept + ': <strong style="color: #fff;">' + m.percentage + '%</strong> (' + m.count + ')' +
        '</span>';
      }).join('');

      return '<div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06);">' +
        '<div style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 4px; display: flex; justify-content: space-between;">' +
        '<span>Hiring Distribution</span>' +
        (c.primaryDepartment ? '<span style="color: #38bdf8; font-weight: 600;">Main: ' + c.primaryDepartment + '</span>' : '') +
        '</div>' +
        '<div style="display: flex; height: 6px; border-radius: 3px; overflow: hidden; background: #1e293b; margin-bottom: 6px;">' +
        segments +
        '</div>' +
        '<div style="display: flex; flex-wrap: wrap; gap: 8px;">' +
        badges +
        '</div>' +
        '</div>';
    }

    function getCompanyRegionBadge(c) {
      const reg = c.usRegion || (c.isMidwest ? 'midwest' : 'other');
      switch(reg) {
        case 'midwest':
          return '<span class="tag tag-midwest">📍 US-Midwest (' + (c.locationHint || 'Midwest') + ')</span>';
        case 'west':
          return '<span class="tag tag-west">🌲 US-West (' + (c.locationHint || 'West') + ')</span>';
        case 'northeast':
          return '<span class="tag tag-northeast">🗽 US-Northeast (' + (c.locationHint || 'Northeast') + ')</span>';
        case 'south':
          return '<span class="tag tag-south">☀️ US-South (' + (c.locationHint || 'South') + ')</span>';
        case 'mountain':
          return '<span class="tag tag-mountain">🏔️ US-Mountain (' + (c.locationHint || 'Mountain') + ')</span>';
        default:
          return c.locationHint ? '<span class="tag">🌐 ' + c.locationHint + '</span>' : '';
      }
    }

    function renderCompaniesList(comps) {
      const container = document.getElementById('companies-container');
      if (!comps || comps.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 32px;">No companies found.</p>';
        return;
      }

      container.innerHTML = comps.map(c => {
        const isMidwestComp = c.isMidwest || c.usRegion === 'midwest' || (c.locationHint && /\b(IL|IN|WI|MN|OH|MI|MO|IA|KS|NE|ND|SD|Chicago|Indianapolis|Minneapolis|Madison|Cincinnati|Columbus|Cleveland|Detroit|Ann Arbor|Midwest)\b/i.test(c.locationHint));
        const fundingBadge = getCompanyFundingBadge(c);
        const deptWeightsHtml = renderDepartmentWeightsBar(c);

        return \`
        <div class="company-card \${isMidwestComp ? 'company-card-midwest' : ''}">
          <div class="company-header">
            <a class="company-name" href="\${c.websiteUrl}" target="_blank">\${c.name} ↗</a>
            <div style="display: flex; gap: 6px; align-items: center;">
              \${c.companyTier === 'tier_1' ? '<span class="company-badge" style="background: rgba(245, 158, 11, 0.2); color: #fcd34d; border: 1px solid rgba(245, 158, 11, 0.3);">⭐ Tier 1</span>' : ''}
              <span class="company-badge">\${c.headcountEstimate || '1-20'} team</span>
            </div>
          </div>
          <p class="company-desc">\${c.description || c.tagline || 'Independent tech company.'}</p>
          <div class="job-tags">
            \${fundingBadge}
            \${getCompanyRegionBadge(c)}
            \${(c.techStack || []).slice(0, 4).map(s => \`<span class="tag">\${s}</span>\`).join('')}
          </div>
          \${deptWeightsHtml}
          <div style="font-size: 11px; color: var(--text-muted); margin-top: auto; padding-top: 6px;">
            \${c.contactEmail ? '📧 ' + c.contactEmail : ''} \${c.locationHint ? '• 🌐 ' + c.locationHint : ''}
          </div>
        </div>
      \`;
      }).join('');
    }

    function renderPagination(containerId, pagination, handlerName) {
      const container = document.getElementById(containerId);
      if (!container) return;

      const { page, limit, total, totalPages } = pagination;
      if (total === 0) {
        container.innerHTML = '';
        return;
      }

      const startItem = (page - 1) * limit + 1;
      const endItem = Math.min(page * limit, total);

      container.innerHTML = \`
        <div class="pagination-info">
          Showing <strong>\${startItem} - \${endItem}</strong> of <strong>\${total.toLocaleString()}</strong> results
        </div>
        <div class="pagination-buttons">
          <button class="page-btn" onclick="\${handlerName}(1)" \${page <= 1 ? 'disabled' : ''}>« First</button>
          <button class="page-btn" onclick="\${handlerName}(\${page - 1})" \${page <= 1 ? 'disabled' : ''}>‹ Prev</button>
          <span style="font-size: 13px; color: var(--text-muted); padding: 0 8px;">
            Page <strong style="color: #fff;">\${page}</strong> of \${totalPages}
          </span>
          <button class="page-btn" onclick="\${handlerName}(\${page + 1})" \${page >= totalPages ? 'disabled' : ''}>Next ›</button>
          <button class="page-btn" onclick="\${handlerName}(\${totalPages})" \${page >= totalPages ? 'disabled' : ''}>Last »</button>
        </div>
      \`;
    }

    function getGradeBadge(grade) {
      switch(grade) {
        case 'founding': return '<span class="tag tag-grade-founding">🚀 Founding</span>';
        case 'lead': return '<span class="tag tag-grade-lead">👑 Lead / Staff</span>';
        case 'senior': return '<span class="tag tag-grade-senior">💎 Senior</span>';
        case 'mid': return '<span class="tag tag-grade-mid">⚡ Mid-Level</span>';
        case 'junior': return '<span class="tag tag-grade-junior">🌱 Junior</span>';
        case 'new_grad': return '<span class="tag tag-grade-newgrad">🎓 New Grad</span>';
        case 'intern': return '<span class="tag tag-grade-junior">🐣 Intern</span>';
        default: return '<span class="tag tag-grade-mid">⚡ Mid-Level</span>';
      }
    }

    function getTechBadge(cat) {
      switch(cat) {
        case 'ai_ml': return '<span class="tag tag-cat">🤖 AI & LLM</span>';
        case 'backend_systems': return '<span class="tag tag-cat">⚙️ Backend & Systems</span>';
        case 'frontend_ui': return '<span class="tag tag-cat">🎨 Frontend & UI</span>';
        case 'devops_cloud': return '<span class="tag tag-cat">☁️ Cloud & DevOps</span>';
        case 'product_design': return '<span class="tag tag-cat">📐 Product Design</span>';
        default: return '<span class="tag tag-cat">💻 Full-Stack</span>';
      }
    }

    function renderLogs(logs) {
      const container = document.getElementById('logs-container');
      if (!logs || logs.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted)">No agent logs available.</p>';
        return;
      }
      container.innerHTML = logs.map(l => {
        const time = new Date(l.createdAt).toLocaleTimeString();
        return \`
          <div class="log-row">
            <span class="log-time">[\${time}]</span>
            <span class="log-agent">\${l.agentName}</span>
            <span class="log-status-\${l.status}">[\${l.status.toUpperCase()}]</span>
            <span class="log-msg">\${l.message} (\${l.durationMs}ms)</span>
          </div>
        \`;
      }).join('');
    }

    function fillSeed(url) {
      document.getElementById('seed-input').value = url;
    }

    async function triggerCrawl() {
      const input = document.getElementById('seed-input');
      const url = input.value.trim();
      if (!url) return alert('Please enter a website URL');

      const btn = document.getElementById('btn-crawl');
      btn.innerText = 'Dispatching...';
      btn.disabled = true;

      try {
        const res = await fetch('/api/crawl/seed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        alert('Dispatched to Agent pipeline! Status: ' + (data.message || 'Queued'));
        input.value = '';
        setTimeout(loadData, 1000);
      } catch (err) {
        alert('Failed to dispatch: ' + err.message);
      } finally {
        btn.innerText = 'Dispatch to Discovery Queue';
        btn.disabled = false;
      }
    }

    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick')?.includes("'" + tab + "'"));
      if (activeBtn) activeBtn.classList.add('active');

      const target = document.getElementById('tab-' + tab);
      if (target) target.classList.add('active');

      if (tab === 'companies' && !companiesLoaded) {
        fetchCompanies(1);
      }

      if (tab === 'rerank' && !rerankLoaded) {
        fetchRealtimeRerankReport();
      }
    }

    // Real-time Reranking & Decision CV State
    let rerankLoaded = false;
    let currentRerankReport = null;

    async function fetchRealtimeRerankReport(targetGroup) {
      const group = targetGroup || document.getElementById('rerank-group-filter')?.value || 'all';
      const container = document.getElementById('rerank-jobs-container');
      if (container) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 24px;">🔄 Fetching real-time reranked JDs from Edge...</p>';
      }

      try {
        const res = await fetch('/api/reports/realtime-jd-ranking?target_group=' + encodeURIComponent(group) + '&limit=25');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        currentRerankReport = data;
        rerankLoaded = true;
        renderRerankReport(data);
      } catch (err) {
        console.error('Failed to load rerank report:', err);
        if (container) {
          container.innerHTML = '<p style="color: var(--danger); text-align: center; padding: 24px;">Failed to load real-time ranking report: ' + err.message + '</p>';
        }
      }
    }

    function onRerankGroupFilterChange() {
      const val = document.getElementById('rerank-group-filter')?.value || 'all';
      fetchRealtimeRerankReport(val);
    }

    function renderRerankReport(data) {
      if (!data) return;

      const totalEl = document.getElementById('rerank-stat-total');
      const topSkillEl = document.getElementById('rerank-stat-top-skill');
      const topGroupEl = document.getElementById('rerank-stat-top-group');
      const summaryEl = document.getElementById('rerank-market-summary');

      if (totalEl) totalEl.innerText = String(data.totalJdsAnalyzed || 0);
      if (summaryEl && data.marketSummary) summaryEl.innerText = data.marketSummary;

      if (data.trendingSkills && data.trendingSkills.length > 0) {
        if (topSkillEl) {
          topSkillEl.innerText = data.trendingSkills[0].skill + ' (' + data.trendingSkills[0].demandGrowth + ')';
        }
        const skillsContainer = document.getElementById('rerank-trending-skills');
        if (skillsContainer) {
          skillsContainer.innerHTML = data.trendingSkills.map(function(s) {
            return '<span style="background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">' +
              escapeHtml(s.skill) + ' <span style="color: #34d399; font-size: 10px; font-weight: 700;">' + escapeHtml(s.demandGrowth) + '</span></span>';
          }).join('');
        }
      }

      if (data.targetGroupBreakdown && topGroupEl) {
        const topGrpEntry = Object.entries(data.targetGroupBreakdown).sort((a, b) => b[1].count - a[1].count)[0];
        if (topGrpEntry) {
          const names = {
            early_stage_startups: '🚀 Early-Stage Startups',
            scaleups_growth: '💎 Scale-Ups',
            ai_first_innovators: '🤖 AI-First',
            midwest_regional: '🌾 US-Midwest Tech',
            new_grad_junior: '🌱 New Grad',
            remote_first_boutique: '🏠 Remote Boutique'
          };
          topGroupEl.innerText = (names[topGrpEntry[0]] || topGrpEntry[0]) + ' (' + topGrpEntry[1].count + ')';
        }
      }

      const container = document.getElementById('rerank-jobs-container');
      if (!container) return;

      const jobs = data.topRankedJobs || [];
      if (jobs.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 32px;">No JDs found matching this target group.</p>';
        return;
      }

      container.innerHTML = jobs.map(function(item, idx) {
        var j = item.job;
        var r = item.rerank;
        var rank = idx + 1;
        var trendIcon = r.trendDirection === 'trending_up' ? '▲ Up' : (r.trendDirection === 'cooling' ? '▼ Cooling' : '● Stable');
        var trendColor = r.trendDirection === 'trending_up' ? '#34d399' : (r.trendDirection === 'cooling' ? '#f87171' : '#94a3b8');
        var salaryText = j.salaryMin && j.salaryMax ? ('$' + j.salaryMin.toLocaleString() + ' - $' + j.salaryMax.toLocaleString()) : (j.salaryMin ? ('$' + j.salaryMin.toLocaleString() + '+') : 'Not Disclosed');

        return '<div style="background: rgba(15, 23, 42, 0.6); border: 1px solid var(--card-border); border-radius: 10px; padding: 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">' +
          '<div style="display: flex; align-items: center; gap: 14px; flex: 1; min-width: 280px;">' +
            '<div style="background: linear-gradient(135deg, #38bdf8, #a855f7); color: #000; font-weight: 800; font-size: 14px; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">#' + rank + '</div>' +
            '<div>' +
              '<div style="font-size: 15px; font-weight: 700; color: #fff;">' + escapeHtml(j.title) + '</div>' +
              '<div style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">' +
                '🏢 <strong style="color: #cbd5e1;">' + escapeHtml(j.companyName || j.companyId) + '</strong> • 📍 ' + (j.isRemote ? 'Remote' : escapeHtml(j.location || 'US')) + ' • 💰 <span style="color: #34d399; font-weight: 600;">' + salaryText + '</span>' +
              '</div>' +
              '<div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">' +
                '<span style="background: rgba(168, 85, 247, 0.15); color: #c084fc; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600;">Group: ' + r.primaryTargetGroup + '</span>' +
                '<span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; font-size: 11px; padding: 2px 8px; border-radius: 4px;">Demand: ' + r.demandScore + '/100</span>' +
                '<span style="background: rgba(16, 185, 129, 0.15); color: #34d399; font-size: 11px; padding: 2px 8px; border-radius: 4px;">Freshness: ' + r.freshnessScore + '/100</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div style="display: flex; align-items: center; gap: 16px;">' +
            '<div style="text-align: right;">' +
              '<div style="font-size: 20px; font-weight: 800; color: #38bdf8;">' + r.compositeScore + ' <span style="font-size: 12px; color: var(--text-muted);">/100</span></div>' +
              '<div style="font-size: 11px; font-weight: 700; color: ' + trendColor + ';">' + trendIcon + '</div>' +
            '</div>' +
            '<a href="' + escapeHtml(j.applyType === 'email' ? ('mailto:' + j.applyTarget) : j.applyTarget) + '" target="_blank" rel="noopener noreferrer" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 6px; padding: 8px 14px; font-size: 12px; font-weight: 600; text-decoration: none; display: inline-block;">Direct Apply ↗</a>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    function onDecisionBaseCvChange() {
      const select = document.getElementById('decision-base-cv');
      const cvId = select?.value;
      if (!cvId || cvId === 'sample') {
        document.getElementById('decision-cv-content').value = 
          "# " + (currentUser?.firstName || "Candidate") + " - Software Engineer\\n\\n## Experience\\n- Software Engineer building scalable web applications, REST APIs, and backend microservices.\\n- Experienced with automated testing and relational databases.\\n\\n## Skills\\nTypeScript, Node.js, Python, PostgreSQL, React, Docker, Git";
        return;
      }

      const cv = userCvsList.find(c => c.id === cvId);
      if (cv) {
        document.getElementById('decision-cv-content').value = cv.content;
      }
    }

    let lastOptimizedCvMarkdown = '';

    async function runDecisionOptimization() {
      const btn = document.getElementById('btn-run-decision');
      const targetGroup = document.getElementById('decision-target-group')?.value || 'early_stage_startups';
      const content = document.getElementById('decision-cv-content')?.value.trim();
      const saveAsVersion = document.getElementById('decision-save-checkbox')?.checked ?? true;
      const baseCvId = document.getElementById('decision-base-cv')?.value;

      if (!content) {
        alert('Please enter or select CV content to optimize!');
        return;
      }

      btn.disabled = true;
      btn.innerText = '⏳ Running Cloudflare Decision API...';

      try {
        const payload = {
          target_group: targetGroup,
          custom_cv_content: content,
          base_cv_id: baseCvId !== 'sample' ? baseCvId : undefined,
          save_as_version: saveAsVersion,
        };

        const res = await fetch('/api/user/cvs/optimize-decision', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (res.status === 401) {
          openLoginModal();
          throw new Error('Please log in via Telegram Bot to save and optimize CVs!');
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'HTTP ' + res.status);
        }

        const data = await res.json();
        const decision = data.decision;
        lastOptimizedCvMarkdown = decision.optimizedCvContent;

        // Render Results
        document.getElementById('decision-results-container').style.display = 'block';
        document.getElementById('decision-current-score').innerText = decision.currentMatchScore + '%';
        document.getElementById('decision-projected-score').innerText = decision.projectedMatchScore + '%';
        document.getElementById('decision-strategy-text').innerText = decision.targetGroupStrategy;

        // Additions
        const addsEl = document.getElementById('decision-additions-list');
        if (addsEl) {
          addsEl.innerHTML = (decision.additions || []).map(function(a) {
            return '<div style="background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981; padding: 8px 12px; border-radius: 4px;">' +
              '<div style="font-weight: 700; color: #6ee7b7; font-size: 13px;">' + escapeHtml(a.item) + '</div>' +
              '<div style="color: var(--text-muted); font-size: 11px; margin-top: 2px;">💡 ' + escapeHtml(a.rationale) + '</div>' +
            '</div>';
          }).join('') || '<div style="color: var(--text-muted); font-size: 12px;">Profile already covers key skills for this segment well.</div>';
        }

        // Removals
        const remsEl = document.getElementById('decision-removals-list');
        if (remsEl) {
          remsEl.innerHTML = (decision.removals || []).map(function(r) {
            return '<div style="background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; padding: 8px 12px; border-radius: 4px;">' +
              '<div style="font-weight: 700; color: #fca5a5; font-size: 13px;">' + escapeHtml(r.item) + '</div>' +
              '<div style="color: var(--text-muted); font-size: 11px; margin-top: 2px;">⚠️ ' + escapeHtml(r.rationale) + '</div>' +
            '</div>';
          }).join('') || '<div style="color: var(--text-muted); font-size: 12px;">No deprecated technologies or redundant fluff detected.</div>';
        }

        // Output markdown
        document.getElementById('decision-optimized-output').value = decision.optimizedCvContent;

        if (data.savedCv) {
          fetchUserCvs();
        }
      } catch (err) {
        alert(err.message);
      } finally {
        btn.disabled = false;
        btn.innerText = '⚡ Analyze & Optimize with Decision API';
      }
    }

    function copyOptimizedCv() {
      const output = document.getElementById('decision-optimized-output')?.value;
      if (!output) return;
      navigator.clipboard.writeText(output).then(() => {
        alert('Optimized CV content copied to Clipboard!');
      });
    }

    // User & MCP State
    let currentUser = null;
    let userCvsList = [];
    let currentTailorJob = null;
    let currentTailoredAnalysis = null;

    function getAuthToken() {
      return localStorage.getItem('orp_user_token') || '';
    }

    function setAuthToken(token) {
      if (token) {
        localStorage.setItem('orp_user_token', token);
      } else {
        localStorage.removeItem('orp_user_token');
      }
    }

    function getAuthHeaders() {
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }
      return headers;
    }

    async function checkAuth() {
      const token = getAuthToken();
      try {
        const res = await fetch('/api/user/me', {
          headers: token ? { 'Authorization': 'Bearer ' + token } : {}
        });
        if (res.ok) {
          const data = await res.json();
          currentUser = data.user;
          renderAuthHeader();
          fetchUserCvs();
          loadUserSubscription();
          return;
        }
      } catch (err) {
        console.warn('Auth check error:', err);
      }
      currentUser = null;
      renderAuthHeader();
      renderSubscriptionBanner();
    }

    function renderAuthHeader() {
      const authSection = document.getElementById('auth-section');
      if (!authSection) return;

      if (currentUser) {
        const handle = currentUser.username ? '@' + currentUser.username : currentUser.firstName;
        authSection.innerHTML = \`
          <div class="user-pill" title="Signed in via Telegram">✈️ <strong>\${handle}</strong></div>
          <button class="header-btn" onclick="openMcpModal()">🔌 MCP Config</button>
          <button class="header-btn" onclick="openMyCvsModal()">📄 My CVs (<span id="cv-header-count">\${userCvsList.length}</span>)</button>
          <button class="header-btn-secondary" onclick="logout()">Logout</button>
        \`;
      } else {
        authSection.innerHTML = \`
          <button class="header-btn-primary" onclick="openLoginModal()">✈️ Login with Telegram</button>
        \`;
      }
    }

    let currentTgSession = null;
    let tgPollingInterval = null;

    function openModal(id) {
      const el = document.getElementById(id);
      if (el) el.classList.add('active');
    }

    function closeModal(id) {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
      if (id === 'modal-login') {
        stopTgPolling();
      }
    }

    function openLoginModal() {
      openModal('modal-login');
      initTelegramBotAuth();
    }

    async function initTelegramBotAuth() {
      const syncTitle = document.getElementById('tg-sync-title');
      const syncSubtitle = document.getElementById('tg-sync-subtitle');
      const botLink = document.getElementById('tg-bot-link');
      const qrImg = document.getElementById('tg-qr-img');

      if (syncTitle) syncTitle.innerText = 'Initializing connection to Telegram Bot...';
      if (syncSubtitle) syncSubtitle.innerText = 'Please wait a moment...';

      try {
        const res = await fetch('/api/auth/telegram/session');
        const data = await res.json();
        currentTgSession = data.sessionToken;

        if (botLink) {
          botLink.href = data.deepLink;
          botLink.innerHTML = '<span style="font-size: 20px;">✈️</span> Open Bot @' + data.botUsername + ' to Log In';
        }
        if (qrImg) {
          qrImg.src = data.qrUrl;
        }
        if (syncTitle) syncTitle.innerText = 'Waiting for you to press [Start] in Telegram...';
        if (syncSubtitle) syncSubtitle.innerText = 'After opening @' + data.botUsername + ', press the [Start] button';

        startTgPolling();
      } catch (err) {
        if (syncTitle) syncTitle.innerText = 'Bot connection error: ' + err.message;
      }
    }

    function onOpenBotClicked() {
      const syncTitle = document.getElementById('tg-sync-title');
      if (syncTitle) syncTitle.innerHTML = '⚡ Waiting for you to press [Start] in Telegram...';
    }

    function startTgPolling() {
      stopTgPolling();
      tgPollingInterval = setInterval(pollTgAuthStatus, 1500);
    }

    function stopTgPolling() {
      if (tgPollingInterval) {
        clearInterval(tgPollingInterval);
        tgPollingInterval = null;
      }
    }

    async function pollTgAuthStatus() {
      if (!currentTgSession) return;
      try {
        const res = await fetch('/api/auth/telegram/session?token=' + encodeURIComponent(currentTgSession));
        if (res.status === 200) {
          const data = await res.json();
          if (data.status === 'authenticated' && data.user) {
            stopTgPolling();
            const syncTitle = document.getElementById('tg-sync-title');
            if (syncTitle) syncTitle.innerHTML = '🎉 <span style="color: #34d399;">Login successful! Redirecting...</span>';
            
            currentUser = data.user;
            setAuthToken(data.token || data.user.apiToken);
            setTimeout(() => {
              closeModal('modal-login');
              renderAuthHeader();
              fetchUserCvs();
              loadUserSubscription();
              openMcpModal();
            }, 600);
          }
        }
      } catch (err) {
        console.warn('Polling error:', err);
      }
    }

    async function quickDemoLogin() {
      const btn = document.getElementById('btn-quick-demo');
      if (btn) {
        btn.innerText = 'Processing...';
        btn.disabled = true;
      }
      try {
        const sessionToken = currentTgSession || ('demo_' + Date.now());
        const res = await fetch('/api/auth/telegram/confirm-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: sessionToken,
            username: 'tuan_engineer',
            first_name: 'Tuan Nguyen'
          })
        });
        const data = await res.json();
        if (data.success && data.user) {
          stopTgPolling();
          currentUser = data.user;
          setAuthToken(data.token || data.user.apiToken);
          closeModal('modal-login');
          renderAuthHeader();
          await fetchUserCvs();
          await loadUserSubscription();
          openMcpModal();
        } else {
          alert('Demo login failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Quick demo failed: ' + err.message);
      } finally {
        if (btn) {
          btn.innerText = '⚡ One-click Demo Login';
          btn.disabled = false;
        }
      }
    }

    async function submitTelegramLogin() {
      quickDemoLogin();
    }

    async function logout() {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {}
      setAuthToken(null);
      currentUser = null;
      userCvsList = [];
      currentUserSubscription = null;
      renderAuthHeader();
      renderSubscriptionBanner();
    }

    let currentUserSubscription = null;

    async function loadUserSubscription() {
      if (!currentUser) {
        renderSubscriptionBanner();
        return;
      }
      try {
        const res = await fetch('/api/user/subscription', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          currentUserSubscription = data.subscription;
        }
      } catch (err) {
        console.warn('Load subscription error:', err);
      }
      renderSubscriptionBanner();
    }

    function renderSubscriptionBanner() {
      const banner = document.getElementById('subscription-banner');
      if (!banner) return;
      const desc = document.getElementById('sub-banner-desc');
      const actions = document.getElementById('sub-banner-actions');
      if (!actions) return;

      if (!currentUser) {
        if (desc) desc.innerText = 'Receive top 5 curated unlisted jobs automatically via Telegram or query from your AI Agent daily.';
        actions.innerHTML = '<button class="btn-sub-action" onclick="openLoginModal()">✈️ Subscribe via Telegram</button>';
        return;
      }

      if (currentUserSubscription && currentUserSubscription.isActive) {
        const role = currentUserSubscription.targetRoles && currentUserSubscription.targetRoles.length > 0 ? currentUserSubscription.targetRoles[0] : 'All Roles';
        const region = currentUserSubscription.regions && currentUserSubscription.regions.length > 0 ? currentUserSubscription.regions[0].toUpperCase() : 'MIDWEST';
        if (desc) desc.innerHTML = 'Active: Receiving daily digest at <strong>02:00 UTC</strong> via Telegram Bot (' + escapeHtml(role) + ' / ' + escapeHtml(region) + ').';
        actions.innerHTML = '<button class="btn-sub-action active" onclick="toggleDashboardSubscription()">⏸ Pause Daily Digest</button>';
      } else {
        if (desc) desc.innerText = 'Subscribe to receive top 5 unlisted high-growth tech jobs straight to your Telegram daily.';
        actions.innerHTML = '<button class="btn-sub-action" onclick="toggleDashboardSubscription()">⚡ Enable Daily Digest</button>';
      }
    }

    async function toggleDashboardSubscription() {
      if (!currentUser) {
        openLoginModal();
        return;
      }
      const newActive = !(currentUserSubscription && currentUserSubscription.isActive);
      try {
        const res = await fetch('/api/user/subscription', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ is_active: newActive })
        });
        if (res.ok) {
          const data = await res.json();
          currentUserSubscription = data.subscription;
          renderSubscriptionBanner();
        }
      } catch (err) {
        alert('Failed to update subscription: ' + err.message);
      }
    }

    function openMcpModal() {
      if (!currentUser) {
        openLoginModal();
        return;
      }

      const origin = window.location.origin;
      const mcpUrl = origin + '/mcp';
      const token = currentUser.apiToken;

      document.getElementById('mcp-endpoint-val').innerText = mcpUrl;
      document.getElementById('mcp-token-val').innerText = token;

      const cursorConfig = {
        "mcpServers": {
          "offradar-jobs": {
            "url": mcpUrl,
            "headers": {
              "Authorization": "Bearer " + token
            }
          }
        }
      };
      document.getElementById('cursor-json-val').innerText = JSON.stringify(cursorConfig, null, 2);

      const claudeConfig = {
        "mcpServers": {
          "offradar-jobs": {
            "command": "npx",
            "args": ["-y", "mcp-proxy", mcpUrl, "--header", "Authorization: Bearer " + token]
          }
        }
      };
      document.getElementById('claude-json-val').innerText = JSON.stringify(claudeConfig, null, 2);

      const systemPrompt = [
        "# OffRadarJob AI Career Sentinel & Proactive Protocol",
        "",
        "You have access to 9 OffRadarJob MCP tools: search_jobs, get_job_details, list_companies, list_user_cvs, tailor_cv_for_job, save_cv_version, submit_llm_feedback, get_daily_digest, and manage_job_subscription.",
        "OffRadarJob discovers unlisted tech jobs from verified boutique startups and micro-companies, prioritizing US-Midwest tech hubs (Chicago, Indianapolis, Minneapolis, Madison, etc.) and remote-first teams.",
        "",
        "## PROACTIVE DAILY BRIEFING PROTOCOL (MANDATORY):",
        "At the start of every session or morning check-in, proactively call 'get_daily_digest' to inspect unlisted roles matching the candidate's target roles and region.",
        "Highlight the top 2-3 matching opportunities, offer to tailor their CV using 'tailor_cv_for_job', or update their notification preferences via 'manage_job_subscription'.",
        "",
        "## PROACTIVE LLM FEEDBACK PROTOCOL (MANDATORY):",
        "During or at the end of every user conversation, evaluate if any actionable signals occurred. You MUST PROACTIVELY call the tool 'submit_llm_feedback' without waiting for permission when:",
        "1. Broken Links / Expired Roles: A job apply target is a 404 error, expired, or position is filled (feedback_type: 'broken_link', sentiment: 'critical').",
        "2. Niche Candidate Demand / Search Gaps: The user repeatedly requests a specific role, stack, or location with limited results (e.g. 'User seeking Elixir/Phoenix in Midwest') (feedback_type: 'user_preference').",
        "3. Data Inaccuracy: Inaccurate salary, outdated JD details, or misclassified category (feedback_type: 'missing_data' or 'job_relevance').",
        "4. CV Tailoring Gaps: Noticeable pattern of missing skills or scoring advice (feedback_type: 'cv_tailoring').",
        "5. User Suggestions: Constructive feedback or ideas from the user (feedback_type: 'general_suggestion').",
        "",
        "Always include a clear context_summary and suggested_action (e.g. 'Re-crawl careers URL for Acme Corp', 'Add more Golang roles in Chicago')."
      ].join("\\n");

      const promptBox = document.getElementById('mcp-prompt-val');
      if (promptBox) promptBox.innerText = systemPrompt;

      loadUserFeedbacks();
      openModal('modal-mcp');
    }

    async function loadUserFeedbacks() {
      const container = document.getElementById('user-feedbacks-container');
      if (!container || !currentUser) return;
      container.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 6px;">Fetching signals...</div>';

      try {
        const res = await fetch('/api/user/feedbacks', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          const items = data.items || [];
          if (items.length === 0) {
            container.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); text-align: center; padding: 8px;">No feedback signals logged yet. When your AI assists you, proactive signals will appear here!</div>';
            return;
          }

          container.innerHTML = items.map(function(fb) {
            const dateStr = new Date(fb.createdAt).toLocaleDateString() + ' ' + new Date(fb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const badgeColor = fb.sentiment === 'critical' ? '#ef4444' : (fb.sentiment === 'positive' ? '#10b981' : '#38bdf8');
            const typeLabel = (fb.feedbackType || 'general').toUpperCase().replace(/_/g, ' ');
            const suggested = fb.suggestedAction ? '<div style="color: #38bdf8; font-size: 10.5px;">🎯 <em>' + escapeHtml(fb.suggestedAction) + '</em></div>' : '';
            return '<div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 8px 10px; font-size: 11px;">' +
              '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">' +
                '<span style="background: ' + badgeColor + '22; color: ' + badgeColor + '; border: 1px solid ' + badgeColor + '44; padding: 1px 6px; border-radius: 4px; font-weight: 700;">' + typeLabel + '</span>' +
                '<span style="color: var(--text-muted);">' + dateStr + '</span>' +
              '</div>' +
              '<div style="color: #e2e8f0; margin-bottom: 3px;">' + escapeHtml(fb.comment) + '</div>' +
              suggested +
            '</div>';
          }).join('');
        } else {
          container.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); text-align: center;">Could not load signals.</div>';
        }
      } catch (err) {
        container.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); text-align: center;">Error loading signals.</div>';
      }
    }

    async function submitQuickUserFeedback() {
      const typeSelect = document.getElementById('user-quick-fb-type');
      const input = document.getElementById('user-quick-fb-text');
      const comment = input ? input.value.trim() : '';
      if (!comment) {
        alert('Please enter a feedback message before sending.');
        return;
      }

      const feedbackType = typeSelect ? typeSelect.value : 'general_suggestion';
      try {
        const res = await fetch('/api/user/feedbacks', {
          method: 'POST',
          headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feedback_type: feedbackType,
            comment,
            sentiment: feedbackType === 'broken_link' ? 'critical' : 'neutral',
            suggested_action: 'Direct feedback submitted from Web Dashboard',
          }),
        });

        if (res.ok) {
          if (input) input.value = '';
          alert('Thank you! Your feedback has been sent directly to the OffRadar engineering team.');
          loadUserFeedbacks();
        } else {
          const errData = await res.json().catch(() => ({}));
          alert('Failed to send feedback: ' + (errData.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Network error while sending feedback.');
      }
    }

    function copySnippet(elementId) {
      const text = document.getElementById(elementId)?.value || document.getElementById(elementId)?.innerText || '';
      navigator.clipboard.writeText(text).then(() => {
        alert('Copied to clipboard!');
      }).catch(() => {
        alert('Could not copy to clipboard. Please copy manually.');
      });
    }

    // --- CV Management ---
    async function fetchUserCvs() {
      if (!currentUser) return;
      try {
        const res = await fetch('/api/user/cvs', { headers: getAuthHeaders() });
        if (res.ok) {
          const data = await res.json();
          userCvsList = data.items || [];
          const headerBadge = document.getElementById('cv-header-count');
          if (headerBadge) headerBadge.innerText = String(userCvsList.length);
          renderCvsList();

          const decisionSelect = document.getElementById('decision-base-cv');
          if (decisionSelect) {
            let opts = '<option value="sample">📝 Standard CV Template (Default)</option>';
            for (const cv of userCvsList) {
              opts += '<option value="' + cv.id + '">' + escapeHtml(cv.title) + '</option>';
            }
            decisionSelect.innerHTML = opts;
          }
        }
      } catch (err) {
        console.warn('Error fetching user CVs:', err);
      }
    }

    function openMyCvsModal() {
      if (!currentUser) {
        openLoginModal();
        return;
      }
      fetchUserCvs();
      openModal('modal-my-cvs');
    }

    function toggleNewCvForm() {
      const form = document.getElementById('new-cv-form');
      if (!form) return;
      const isVisible = form.style.display === 'flex';
      form.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        document.getElementById('new-cv-title')?.focus();
      }
    }

    async function saveNewCv() {
      const title = document.getElementById('new-cv-title')?.value.trim();
      const role = document.getElementById('new-cv-role')?.value.trim();
      const skillsRaw = document.getElementById('new-cv-skills')?.value.trim();
      const content = document.getElementById('new-cv-content')?.value.trim();

      if (!title || !content) {
        alert('Please provide at least a title and CV content.');
        return;
      }

      const skills = skillsRaw ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

      try {
        const res = await fetch('/api/user/cvs', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            title,
            targetRole: role || undefined,
            skills,
            content
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to save CV');
        }

        document.getElementById('new-cv-title').value = '';
        document.getElementById('new-cv-role').value = '';
        document.getElementById('new-cv-skills').value = '';
        document.getElementById('new-cv-content').value = '';
        toggleNewCvForm();

        await fetchUserCvs();
        alert('CV saved successfully!');
      } catch (err) {
        alert('Error saving CV: ' + err.message);
      }
    }

    async function deleteCv(id) {
      if (!confirm('Are you sure you want to delete this CV version?')) return;
      try {
        const res = await fetch('/api/user/cvs/' + id, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        if (res.ok) {
          await fetchUserCvs();
        } else {
          const d = await res.json();
          alert('Delete failed: ' + (d.error || 'Unknown'));
        }
      } catch (err) {
        alert('Delete error: ' + err.message);
      }
    }

    function renderCvsList() {
      const container = document.getElementById('my-cvs-list');
      if (!container) return;

      if (userCvsList.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 24px;">No saved CV versions yet. Click "📁 Import File CV", "+ Add New CV" or use "✨ Tailor CV" on any Job.</p>';
        return;
      }

      container.innerHTML = userCvsList.map(cv => {
        const date = new Date(cv.updatedAt || cv.createdAt).toLocaleDateString();
        const scoreBadge = cv.matchScore != null ? ('<span class="tag" style="background: rgba(16, 185, 129, 0.2); color: #34d399; font-weight: 700;">🎯 ' + cv.matchScore + '% Match</span>') : '';
        const roleBadge = cv.targetRole ? ('<span class="tag">' + escapeHtml(cv.targetRole) + '</span>') : '';
        const targetGroupBadge = cv.targetGroup ? ('<span class="tag" style="background: rgba(168, 85, 247, 0.2); color: #d8b4fe; font-weight: 600;">🏢 ' + escapeHtml(cv.targetGroup.replace(/_/g, ' ')) + '</span>') : '';

        // Render skill chips with tag-cloud styling
        const allSkills = Array.isArray(cv.skills) ? cv.skills : [];
        const displaySkills = allSkills.slice(0, 10);
        const remainder = allSkills.length - displaySkills.length;
        const skillsChips = displaySkills.map(s => '<span class="tag tag-cat" style="font-size: 11px;">' + escapeHtml(s) + '</span>').join(' ') +
          (remainder > 0 ? (' <span class="tag" style="opacity: 0.6; font-size: 10px;">+' + remainder + ' more</span>') : '');

        return '<div class="cv-card-item">' +
          '<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap;">' +
            '<div>' +
              '<h4 style="font-size: 15px; font-weight: 700; color: #fff;">' + escapeHtml(cv.title) + '</h4>' +
              '<div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Saved on ' + date + ' ' + (cv.jobId ? '• Linked to Job ' + escapeHtml(cv.jobId) : '') + '</div>' +
            '</div>' +
            '<div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">' +
              scoreBadge +
              '<button class="header-btn" data-cvid="' + cv.id + '" onclick="openSyncTagCloudModal(this.dataset.cvid)" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); font-size: 11px; padding: 4px 10px;">☁️ Tag Cloud & JD Sync</button>' +
              '<button class="header-btn" data-cvid="' + cv.id + '" onclick="sendCvToDecisionOptimizer(this.dataset.cvid)" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); font-size: 11px; padding: 4px 10px;">⚡ Decision API</button>' +
              '<button class="header-btn-secondary" data-cvid="' + cv.id + '" onclick="deleteCv(this.dataset.cvid)" style="color: #f87171; font-size: 11px; padding: 4px 8px;">🗑️ Delete</button>' +
            '</div>' +
          '</div>' +
          '<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;">' +
            roleBadge + ' ' +
            targetGroupBadge + ' ' +
            skillsChips +
          '</div>' +
          '<div style="margin-top: 6px;">' +
            '<details style="font-size: 12px; color: var(--text-muted);">' +
              '<summary style="cursor: pointer; color: var(--primary);">View Markdown Content</summary>' +
              '<div class="code-snippet" style="margin-top: 8px; max-height: 200px; overflow-y: auto;">' + cv.content.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>' +
            '</details>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    // --- File Import & Tag Cloud Studio State ---
    let activeSyncCvId = null;
    let activeSyncComparison = null;
    let selectedCvFile = null;

    function toggleImportCvSection() {
      const section = document.getElementById('cv-import-section');
      if (!section) return;
      const isVisible = section.style.display === 'flex';
      section.style.display = isVisible ? 'none' : 'flex';
    }

    function handleDragOver(e) {
      e.preventDefault();
      e.stopPropagation();
      const dropzone = document.getElementById('cv-file-dropzone');
      if (dropzone) dropzone.classList.add('dragover');
    }

    function handleDragLeave(e) {
      e.preventDefault();
      e.stopPropagation();
      const dropzone = document.getElementById('cv-file-dropzone');
      if (dropzone) dropzone.classList.remove('dragover');
    }

    function handleDrop(e) {
      e.preventDefault();
      e.stopPropagation();
      const dropzone = document.getElementById('cv-file-dropzone');
      if (dropzone) dropzone.classList.remove('dragover');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processSelectedCvFile(e.dataTransfer.files[0]);
      }
    }

    function handleCvFileChosen(e) {
      if (e.target && e.target.files && e.target.files.length > 0) {
        processSelectedCvFile(e.target.files[0]);
      }
    }

    function processSelectedCvFile(file) {
      selectedCvFile = file;
      const badge = document.getElementById('selected-file-badge');
      const dropzone = document.getElementById('cv-file-dropzone');
      if (badge && dropzone) {
        badge.style.display = 'flex';
        dropzone.style.display = 'none';
        document.getElementById('selected-file-name').innerText = file.name;
        const sizeKb = (file.size / 1024).toFixed(1);
        document.getElementById('selected-file-size').innerText = sizeKb + ' KB • ' + (file.type || 'Document');
      }

      // Auto-fill title if empty
      const titleInput = document.getElementById('import-cv-title');
      if (titleInput && !titleInput.value.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        titleInput.value = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      }
    }

    function clearSelectedCvFile() {
      selectedCvFile = null;
      const badge = document.getElementById('selected-file-badge');
      const dropzone = document.getElementById('cv-file-dropzone');
      const input = document.getElementById('cv-file-input');
      if (input) input.value = '';
      if (badge) badge.style.display = 'none';
      if (dropzone) dropzone.style.display = 'block';
    }

    async function uploadAndAnalyzeCvFile() {
      if (!selectedCvFile) {
        alert('Please select or drop a CV file (PDF, DOCX, TXT, MD, or JSON) to continue.');
        return;
      }
      const btn = document.getElementById('btn-upload-import-cv');
      const prevText = btn ? btn.innerText : '';
      if (btn) {
        btn.innerText = '⏳ Analyzing file & extracting Tag Cloud...';
        btn.disabled = true;
      }

      try {
        const formData = new FormData();
        formData.append('file', selectedCvFile);
        formData.append('save_as_version', 'true');
        const title = document.getElementById('import-cv-title')?.value.trim();
        const role = document.getElementById('import-cv-role')?.value.trim();
        const targetGroup = document.getElementById('import-cv-target-group')?.value;
        if (title) formData.append('version_title', title);
        if (role) formData.append('target_role', role);
        if (targetGroup) formData.append('target_group', targetGroup);

        const token = getAuthToken();
        const headers = {};
        if (token) headers['Authorization'] = 'Bearer ' + token;

        const res = await fetch('/api/user/cvs/import', {
          method: 'POST',
          headers,
          body: formData
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to import and analyze CV file');
        }

        // Show preview in import section
        const previewEl = document.getElementById('import-result-preview');
        if (previewEl) {
          previewEl.style.display = 'flex';
          const statsEl = document.getElementById('import-result-stats');
          if (statsEl) {
            statsEl.innerText = data.parsed.totalTags + ' skills recognized (' + (data.extractedTextLength || data.parsed.content.length) + ' characters of text)';
          }
          const tagsEl = document.getElementById('import-result-tags');
          if (tagsEl && data.parsed.tagCloud && data.parsed.tagCloud.tags) {
            tagsEl.innerHTML = data.parsed.tagCloud.tags.map(function(t) {
              const catClass = 'chip-cat-' + (t.category || 'other');
              const countStr = t.frequency > 1 ? '<small style="opacity: 0.7;"> ×' + t.frequency + '</small>' : '';
              return '<span class="tag-cloud-chip ' + catClass + '">' + escapeHtml(t.name) + countStr + '</span>';
            }).join(' ');
          }
          const openSyncBtn = document.getElementById('btn-open-sync-from-import');
          if (openSyncBtn && data.cv) {
            openSyncBtn.onclick = () => {
              openSyncTagCloudModal(data.cv.id);
            };
          }
        }

        await fetchUserCvs();
      } catch (err) {
        alert('Error importing CV: ' + err.message);
      } finally {
        if (btn) {
          btn.innerText = prevText || '⚡ Upload & Extract Tag Cloud';
          btn.disabled = false;
        }
      }
    }

    // --- Synchronized Tag Cloud Studio Workflow ---
    function openSyncTagCloudModal(cvId) {
      if (!currentUser) {
        openLoginModal();
        alert('Please log in via Telegram to use Synchronized Tag Cloud Studio.');
        return;
      }

      openModal('modal-sync-tag-cloud');
      populateSyncCvSelect(cvId);
      populateSyncJobsGroup();
      runSynchronizedTagCloudComparison();
    }

    function populateSyncCvSelect(selectedId) {
      const select = document.getElementById('sync-cv-select');
      if (!select) return;

      if (userCvsList.length === 0) {
        select.innerHTML = '<option value="">(No CVs yet - please create or import a CV)</option>';
        return;
      }

      let options = '';
      for (const cv of userCvsList) {
        const isSelected = (selectedId && cv.id === selectedId) || (!selectedId && !options);
        if (isSelected) activeSyncCvId = cv.id;
        options += '<option value="' + cv.id + '" ' + (isSelected ? 'selected' : '') + '>' +
          escapeHtml(cv.title) + (cv.targetRole ? ' (' + escapeHtml(cv.targetRole) + ')' : '') +
          '</option>';
      }
      select.innerHTML = options;
    }

    async function populateSyncJobsGroup() {
      const optgroup = document.getElementById('sync-target-jobs-group');
      if (!optgroup) return;

      try {
        const res = await fetch('/api/jobs?limit=25&tech_only=true');
        const data = await res.json();
        const jobs = data.items || [];
        if (jobs.length === 0) {
          optgroup.innerHTML = '<option value="" disabled>(No active jobs available)</option>';
          return;
        }

        optgroup.innerHTML = jobs.map(j => {
          const comp = j.companyName || 'Boutique Tech';
          return '<option value="job:' + j.id + '">💼 ' + escapeHtml(j.title) + ' @ ' + escapeHtml(comp) + '</option>';
        }).join('');
      } catch (err) {
        console.warn('Failed loading jobs for sync select:', err);
      }
    }

    function onSyncCvSelectionChange() {
      const select = document.getElementById('sync-cv-select');
      if (select) {
        activeSyncCvId = select.value;
        runSynchronizedTagCloudComparison();
      }
    }

    async function runSynchronizedTagCloudComparison() {
      if (!activeSyncCvId) {
        if (userCvsList.length > 0 && userCvsList[0]) {
          activeSyncCvId = userCvsList[0].id;
        } else {
          return;
        }
      }

      const targetVal = document.getElementById('sync-target-select')?.value || 'market';
      let payload = { cv_id: activeSyncCvId };

      if (targetVal.startsWith('group:')) {
        payload.target_group = targetVal.replace('group:', '');
      } else if (targetVal.startsWith('job:')) {
        payload.job_id = targetVal.replace('job:', '');
      }

      try {
        const res = await fetch('/api/user/cvs/compare-tags', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to compare tag clouds');
        }

        activeSyncComparison = data.comparison;
        renderSyncComparisonResults(data.comparison);
      } catch (err) {
        console.warn('Sync Tag Cloud Error:', err);
      }
    }

    function renderSyncComparisonResults(comp) {
      if (!comp) return;

      const score = Math.round(comp.matchPercentage || 0);
      const scoreEl = document.getElementById('sync-match-score');
      const fillEl = document.getElementById('sync-score-meter-fill');
      const ratingEl = document.getElementById('sync-match-rating');

      if (scoreEl) scoreEl.innerText = score + '%';
      if (fillEl) fillEl.style.width = score + '%';

      let scoreColor = '#f87171';
      let ratingText = '🚨 Significant Divergence: Realign for target archetype';
      if (score >= 75) {
        scoreColor = '#34d399';
        ratingText = '🎯 Excellent: Strong alignment with hiring requirements';
      } else if (score >= 55) {
        scoreColor = '#38bdf8';
        ratingText = '⚡ High: Matches majority of core technologies';
      } else if (score >= 35) {
        scoreColor = '#fbbf24';
        ratingText = '⚠️ Moderate: Missing several critical required skills';
      }

      if (scoreEl) scoreEl.style.color = scoreColor;
      if (fillEl) fillEl.style.background = scoreColor;
      if (ratingEl) ratingEl.innerText = ratingText;

      const weightedScore = comp.weightedFitScore !== undefined ? Math.round(comp.weightedFitScore) : score;
      const weightedBadge = document.getElementById('sync-weighted-badge');
      if (weightedBadge) {
        weightedBadge.innerText = 'Weighted Fit: ' + weightedScore + '%';
      }

      const atsScore = comp.atsReadabilityScore !== undefined ? Math.round(comp.atsReadabilityScore) : 85;
      const atsBadge = document.getElementById('sync-ats-badge');
      if (atsBadge) {
        atsBadge.innerText = 'ATS: ' + atsScore + '/100';
      }

      const recBox = document.getElementById('sync-recommendation-box');
      const recSummary = document.getElementById('sync-recommendation-summary');
      if (recBox && recSummary) {
        if (comp.recommendationSummary) {
          recBox.style.display = 'block';
          recSummary.innerText = comp.recommendationSummary;
        } else {
          recBox.style.display = 'none';
        }
      }

      const elCountMatched = document.getElementById('count-matched-tags');
      const elCountMissing = document.getElementById('count-missing-tags');
      const elCountCvOnly = document.getElementById('count-cv-only-tags');
      const elCountDeprecated = document.getElementById('count-deprecated-tags');

      if (elCountMatched) elCountMatched.innerText = String((comp.matchedTags || []).length);
      if (elCountMissing) elCountMissing.innerText = String((comp.missingTags || []).length);
      if (elCountCvOnly) elCountCvOnly.innerText = String((comp.cvOnlyTags || []).length);
      if (elCountDeprecated) elCountDeprecated.innerText = String((comp.deprecatedTags || []).length);

      const matchedEl = document.getElementById('sync-matched-tags');
      if (matchedEl) {
        matchedEl.innerHTML = (comp.matchedTags || []).length > 0
          ? comp.matchedTags.map(t => {
              const countStr = t.frequency > 1 ? ' <small style="opacity: 0.7;">(×' + t.frequency + ')</small>' : '';
              return '<span class="tag-cloud-chip chip-status-matched">✅ ' + escapeHtml(t.name) + countStr + '</span>';
            }).join(' ')
          : '<span style="font-size: 11px; color: var(--text-muted);">(No matching skills yet)</span>';
      }

      const missingEl = document.getElementById('sync-missing-tags');
      if (missingEl) {
        missingEl.innerHTML = (comp.missingTags || []).length > 0
          ? comp.missingTags.map(function(t) {
              const safeName = escapeHtml(t.name);
              const growthBadge = t.marketGrowth ? ' <small style="color: #34d399; font-weight: 700;">' + t.marketGrowth + '</small>' : '';
              return '<span class="tag-cloud-chip chip-status-missing" data-skill="' + safeName + '" onclick="addMissingSkillToCv(this.dataset.skill)" title="Click to add this skill to your CV">' +
                '⚡ ' + safeName + growthBadge +
                '<button style="background: rgba(245, 158, 11, 0.4); border: none; color: #fff; border-radius: 4px; padding: 1px 6px; font-size: 10px; margin-left: 6px; cursor: pointer; font-weight: 700;">+ Add</button>' +
                '</span>';
            }).join(' ')
          : '<span style="font-size: 11px; color: #34d399;">🎉 Excellent! No core skills are missing.</span>';
      }

      const cvOnlyEl = document.getElementById('sync-cv-only-tags');
      if (cvOnlyEl) {
        cvOnlyEl.innerHTML = (comp.cvOnlyTags || []).length > 0
          ? comp.cvOnlyTags.map(t => {
              return '<span class="tag-cloud-chip chip-status-cv_only">⭐ ' + escapeHtml(t.name) + '</span>';
            }).join(' ')
          : '<span style="font-size: 11px; color: var(--text-muted);">(No unique skills detected)</span>';
      }

      const deprecatedEl = document.getElementById('sync-deprecated-tags');
      if (deprecatedEl) {
        deprecatedEl.innerHTML = (comp.deprecatedTags || []).length > 0
          ? comp.deprecatedTags.map(t => {
              return '<span class="tag-cloud-chip chip-status-deprecated" title="Legacy technology; consider pruning">🚫 ' + escapeHtml(t.name) + '</span>';
            }).join(' ')
          : '<span style="font-size: 11px; color: #34d399;">✨ Clean profile! No legacy or outdated tech detected.</span>';
      }

      const breakdownEl = document.getElementById('sync-category-breakdown-bar');
      if (breakdownEl) {
        const catCounts = {};
        for (const t of (comp.cvTags || [])) {
          catCounts[t.category] = (catCounts[t.category] || 0) + 1;
        }
        const catLabels = {
          languages: 'Languages',
          frameworks: 'Frameworks',
          cloud_infra: 'Cloud & Infra',
          database: 'Database',
          ai_ml: 'AI / ML',
          architecture: 'Architecture',
          tools: 'Tools & DevOps',
          other: 'Other'
        };

        const pillsHtml = Object.keys(catCounts).map(cat => {
          const label = catLabels[cat] || cat;
          const count = catCounts[cat];
          const chipClass = 'chip-cat-' + cat;
          let catRatio = '';
          if (comp.categoryMatchBreakdown && comp.categoryMatchBreakdown[cat]) {
            const b = comp.categoryMatchBreakdown[cat];
            catRatio = ' <small style="opacity: 0.85;">(' + b.matched + '/' + b.totalJd + ' matched)</small>';
          }
          return '<span class="tag-cloud-chip ' + chipClass + '" style="font-size: 11px;">' + label + ': <strong>' + count + '</strong>' + catRatio + '</span>';
        }).join(' ');

        breakdownEl.innerHTML = '<span style="font-size: 11px; font-weight: 700; color: #cbd5e1; margin-right: 6px;">Skill Category Breakdown:</span>' + pillsHtml;
      }
    }

    async function addMissingSkillToCv(skillName) {
      if (!activeSyncCvId) return;
      const cv = userCvsList.find(c => c.id === activeSyncCvId);
      if (!cv) return;

      const currentSkills = Array.isArray(cv.skills) ? [...cv.skills] : [];
      if (!currentSkills.includes(skillName)) {
        currentSkills.push(skillName);
      }

      let newContent = cv.content;
      if (newContent.includes('## Skills') || newContent.includes('## Technical Skills')) {
        newContent = newContent.replace(new RegExp('(## (?:Technical )?Skills[^\\n]*\\n)', 'i'), '$1- **' + skillName + '**: Hands-on proficiency and applied experience.\\n');
      } else {
        newContent += '\\n\\n## Technical Skills\\n- **' + skillName + '**: Hands-on proficiency and applied experience.';
      }

      try {
        const res = await fetch('/api/user/cvs/' + activeSyncCvId, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            skills: currentSkills,
            content: newContent
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to update CV');
        }

        cv.skills = currentSkills;
        cv.content = newContent;
        await fetchUserCvs();

        // Immediately refresh comparison to show the skill moved from Missing to Matched!
        await runSynchronizedTagCloudComparison();
      } catch (err) {
        alert('Error adding skill: ' + err.message);
      }
    }

    function triggerDecisionOptimizerFromSync() {
      closeModal('modal-sync-tag-cloud');
      closeModal('modal-my-cvs');
      switchTab('rerank');

      if (activeSyncCvId) {
        const cvSelect = document.getElementById('decision-base-cv');
        if (cvSelect) {
          cvSelect.value = activeSyncCvId;
          onDecisionBaseCvChange();
        }
      }

      const targetVal = document.getElementById('sync-target-select')?.value || '';
      if (targetVal.startsWith('group:')) {
        const group = targetVal.replace('group:', '');
        const groupSelect = document.getElementById('decision-target-group');
        if (groupSelect) groupSelect.value = group;
      }

      const optSection = document.getElementById('tab-rerank');
      if (optSection) {
        optSection.scrollIntoView({ behavior: 'smooth' });
      }
    }

    function sendCvToDecisionOptimizer(cvId) {
      closeModal('modal-my-cvs');
      switchTab('rerank');

      const cvSelect = document.getElementById('decision-base-cv');
      if (cvSelect && cvId) {
        cvSelect.value = cvId;
        onDecisionBaseCvChange();
      }

      const optSection = document.getElementById('tab-rerank');
      if (optSection) {
        optSection.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // --- Tailor CV Workflow ---
    function openCvTailorModal(jobId, jobTitleEncoded, companyEncoded, skillsCsvEncoded) {
      if (!currentUser) {
        openLoginModal();
        alert('Please sign in with Telegram first to access AI CV Tailoring.');
        return;
      }

      const jobTitle = decodeURIComponent(jobTitleEncoded);
      const companyName = decodeURIComponent(companyEncoded);
      const skills = decodeURIComponent(skillsCsvEncoded).split(',').map(s => s.trim()).filter(Boolean);

      currentTailorJob = { id: jobId, title: jobTitle, company: companyName, skills: skills };
      currentTailoredAnalysis = null;

      document.getElementById('tailor-target-title').innerText = jobTitle;
      document.getElementById('tailor-target-company').innerText = '🏢 ' + companyName;
      
      const skillsDiv = document.getElementById('tailor-target-skills');
      if (skillsDiv) {
        skillsDiv.innerHTML = skills.length > 0
          ? skills.map(s => '<span class="tag">' + s + '</span>').join('')
          : '<span style="font-size: 11px; color: var(--text-muted);">General Engineering</span>';
      }

      const select = document.getElementById('tailor-base-cv-select');
      if (select) {
        let options = '<option value="">-- Choose Base CV or Use Default Template --</option>';
        for (const cv of userCvsList) {
          options += '<option value="' + cv.id + '">' + cv.title + (cv.targetRole ? ' (' + cv.targetRole + ')' : '') + '</option>';
        }
        select.innerHTML = options;
      }

      const defaultContent = userCvsList.length > 0
        ? userCvsList[0].content
        : "# " + (currentUser.firstName || "Engineer") + " - Software Engineer\\n\\n## Experience\\n- Senior Software Engineer with 5+ years building distributed backend APIs and scalable systems.\\n- Experienced in TypeScript, Node.js, Go, PostgreSQL, Cloudflare Workers, and React.\\n\\n## Skills\\nTypeScript, Python, Go, Node.js, SQL, AWS, Cloudflare, React, Docker";

      document.getElementById('tailor-cv-content').value = defaultContent;
      document.getElementById('tailor-result-area').style.display = 'none';

      openModal('modal-tailor');
    }

    function onTailorBaseCvChange() {
      const select = document.getElementById('tailor-base-cv-select');
      const cvId = select?.value;
      if (!cvId) return;

      const cv = userCvsList.find(c => c.id === cvId);
      if (cv) {
        document.getElementById('tailor-cv-content').value = cv.content;
      }
    }

    async function executeTailorCv() {
      if (!currentTailorJob) return;

      const cvContent = document.getElementById('tailor-cv-content')?.value.trim();
      const baseCvId = document.getElementById('tailor-base-cv-select')?.value || undefined;

      const btn = document.getElementById('btn-execute-tailor');
      btn.innerText = '⚡ Analyzing & Tailoring...';
      btn.disabled = true;

      try {
        const res = await fetch('/api/user/cvs/tailor', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            jobId: currentTailorJob.id,
            baseCvId: baseCvId,
            customCvContent: cvContent
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to tailor CV');
        }

        currentTailoredAnalysis = data.analysis;

        const resultArea = document.getElementById('tailor-result-area');
        resultArea.style.display = 'flex';

        const score = currentTailoredAnalysis.matchScore || 0;
        document.getElementById('tailor-score-fill').style.width = score + '%';
        document.getElementById('tailor-score-text').innerText = score + '%';
        const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
        document.getElementById('tailor-score-fill').style.backgroundColor = color;
        document.getElementById('tailor-score-text').style.color = color;

        document.getElementById('tailor-matched-skills').innerHTML = (currentTailoredAnalysis.matchedSkills || []).length > 0
          ? (currentTailoredAnalysis.matchedSkills || []).map(s => '<span class="tag" style="background: rgba(16, 185, 129, 0.2); color: #34d399;">✓ ' + s + '</span>').join('')
          : '<span style="font-size: 11px; color: var(--text-muted);">None detected</span>';

        document.getElementById('tailor-missing-skills').innerHTML = (currentTailoredAnalysis.missingSkills || []).length > 0
          ? (currentTailoredAnalysis.missingSkills || []).map(s => '<span class="tag" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24;">+ ' + s + '</span>').join('')
          : '<span style="font-size: 11px; color: #34d399;">Full match on required skills!</span>';

        document.getElementById('tailor-suggested-summary').innerText = currentTailoredAnalysis.suggestedSummary || '';
        document.getElementById('tailor-final-markdown').value = currentTailoredAnalysis.tailoredCvMarkdown || '';

        resultArea.scrollIntoView({ behavior: 'smooth' });
      } catch (err) {
        alert('Tailor error: ' + err.message);
      } finally {
        btn.innerText = '⚡ Analyze JD Match & Generate Tailored CV';
        btn.disabled = false;
      }
    }

    async function saveTailoredCv() {
      if (!currentTailoredAnalysis || !currentTailorJob) return;

      const markdown = document.getElementById('tailor-final-markdown')?.value.trim();
      const title = 'Tailored: ' + currentTailorJob.title + ' @ ' + currentTailorJob.company;
      const allSkills = [...(currentTailoredAnalysis.matchedSkills || []), ...(currentTailoredAnalysis.missingSkills || [])];

      const btn = document.getElementById('btn-save-tailored-cv');
      btn.innerText = 'Saving...';
      btn.disabled = true;

      try {
        const res = await fetch('/api/user/cvs', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            title,
            targetRole: currentTailorJob.title,
            jobId: currentTailorJob.id,
            content: markdown,
            skills: allSkills
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to save tailored CV');
        }

        await fetchUserCvs();
        alert('Tailored CV version saved to "My CVs" successfully!');
        closeModal('modal-tailor');
        openMyCvsModal();
      } catch (err) {
        alert('Failed to save CV: ' + err.message);
      } finally {
        btn.innerText = '💾 Save as Tailored CV Version';
        btn.disabled = false;
      }
    }

    window.changeJobsPage = changeJobsPage;
    window.changeCompsPage = changeCompsPage;
    window.openLoginModal = openLoginModal;
    window.closeModal = closeModal;
    window.onOpenBotClicked = onOpenBotClicked;
    window.quickDemoLogin = quickDemoLogin;
    window.submitTelegramLogin = submitTelegramLogin;
    window.logout = logout;
    window.openMcpModal = openMcpModal;
    window.copySnippet = copySnippet;
    window.openMyCvsModal = openMyCvsModal;
    window.toggleNewCvForm = toggleNewCvForm;
    window.saveNewCv = saveNewCv;
    window.deleteCv = deleteCv;
    window.openCvTailorModal = openCvTailorModal;
    window.onTailorBaseCvChange = onTailorBaseCvChange;
    window.executeTailorCv = executeTailorCv;
    window.saveTailoredCv = saveTailoredCv;
    window.toggleNewGradFilter = toggleNewGradFilter;
    window.loadUserFeedbacks = loadUserFeedbacks;
    window.submitQuickUserFeedback = submitQuickUserFeedback;
    window.toggleDashboardSubscription = toggleDashboardSubscription;
    window.loadUserSubscription = loadUserSubscription;
    window.toggleImportCvSection = toggleImportCvSection;
    window.handleDragOver = handleDragOver;
    window.handleDragLeave = handleDragLeave;
    window.handleDrop = handleDrop;
    window.handleCvFileChosen = handleCvFileChosen;
    window.clearSelectedCvFile = clearSelectedCvFile;
    window.uploadAndAnalyzeCvFile = uploadAndAnalyzeCvFile;
    window.openSyncTagCloudModal = openSyncTagCloudModal;
    window.onSyncCvSelectionChange = onSyncCvSelectionChange;
    window.runSynchronizedTagCloudComparison = runSynchronizedTagCloudComparison;
    window.addMissingSkillToCv = addMissingSkillToCv;
    window.triggerDecisionOptimizerFromSync = triggerDecisionOptimizerFromSync;
    window.sendCvToDecisionOptimizer = sendCvToDecisionOptimizer;
    window.escapeHtml = escapeHtml;

    async function loadData() {
      try {
        checkAuth();
        fetchStats();

        // Handle URL parameters (e.g. ?grade=new_grad or ?region=midwest)
        const urlParams = new URLSearchParams(window.location.search);
        const gradeParam = urlParams.get('grade');
        if (gradeParam) {
          const gradeSelect = document.getElementById('grade-filter');
          if (gradeSelect) gradeSelect.value = gradeParam;
          const ngBtn = document.getElementById('quick-newgrad-btn');
          if (ngBtn && gradeParam === 'new_grad') {
            ngBtn.style.background = '#10b981';
            ngBtn.style.borderColor = '#10b981';
            ngBtn.style.color = '#ffffff';
            ngBtn.style.boxShadow = '0 0 10px rgba(16, 185, 129, 0.4)';
          }
        }
        const regionParam = urlParams.get('region');
        if (regionParam) {
          const regionSelect = document.getElementById('region-filter');
          if (regionSelect) regionSelect.value = regionParam;
        }

        await fetchJobs(1);
      } catch (err) {
        console.error('Error in loadData:', err);
      }
    }

    loadData();
    // Poll stats every 30s instead of slamming D1 with 2500 jobs every 5s
    setInterval(fetchStats, 30000);
  </script>
</body>
</html>`;
}
