export function renderDashboardHtml(): string {
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
        <a href="/admin" style="text-decoration: none; color: #38bdf8; font-size: 13px; font-weight: 600; padding: 6px 14px; border: 1px solid #1f2a44; border-radius: 8px; background: #131b2e;">⚙️ Admin</a>
        <div class="status-badge">
          <span class="status-dot"></span>
          Edge Active
        </div>
      </div>
    </header>

    <div class="midwest-banner">
      <div class="midwest-banner-text">
        <strong>🇺🇸 Toàn diện 5 Vùng Công nghệ Hoa Kỳ</strong> — Khai phá việc làm tech off-radar từ các micro-companies & boutique studios: 📍 <strong>Midwest</strong> (Chicago, Indy, Twin Cities) • 🌲 <strong>West</strong> (SF Bay, Seattle, Portland) • 🗽 <strong>Northeast</strong> (NYC, Boston, Philly) • ☀️ <strong>South</strong> (Austin, Atlanta, Raleigh) • 🏔️ <strong>Mountain</strong> (Denver, Salt Lake City).
      </div>
      <span class="midwest-tag">⭐ US Nationwide + Midwest Priority</span>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Micro-Companies</span>
        <span class="stat-value" id="stat-companies">0</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Tech Jobs</span>
        <span class="stat-value" id="stat-jobs">0</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Senior / Founding</span>
        <span class="stat-value" id="stat-senior" style="color: #c084fc;">0</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Midwest Focus</span>
        <span class="stat-value" id="stat-midwest" style="color: #fb7185;">100%</span>
      </div>
    </div>

    <div class="region-pills-bar">
      <div class="region-pill active" id="pill-all" onclick="setRegionFilter('all')">
        <span class="pill-dot" style="background: #38bdf8;"></span>
        <span>Toàn bộ US: <strong id="stat-reg-all">0</strong></span>
      </div>
      <div class="region-pill" id="pill-midwest" onclick="setRegionFilter('midwest')">
        <span class="pill-dot" style="background: #f43f5e;"></span>
        <span>📍 Midwest: <strong id="stat-reg-midwest">0</strong></span>
      </div>
      <div class="region-pill" id="pill-west" onclick="setRegionFilter('west')">
        <span class="pill-dot" style="background: #10b981;"></span>
        <span>🌲 West: <strong id="stat-reg-west">0</strong></span>
      </div>
      <div class="region-pill" id="pill-northeast" onclick="setRegionFilter('northeast')">
        <span class="pill-dot" style="background: #6366f1;"></span>
        <span>🗽 Northeast: <strong id="stat-reg-northeast">0</strong></span>
      </div>
      <div class="region-pill" id="pill-south" onclick="setRegionFilter('south')">
        <span class="pill-dot" style="background: #f59e0b;"></span>
        <span>☀️ South: <strong id="stat-reg-south">0</strong></span>
      </div>
      <div class="region-pill" id="pill-mountain" onclick="setRegionFilter('mountain')">
        <span class="pill-dot" style="background: #06b6d4;"></span>
        <span>🏔️ Mountain: <strong id="stat-reg-mountain">0</strong></span>
      </div>
    </div>

    <div class="crawl-trigger">
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
    </div>

    <div class="filter-bar">
      <div class="nav-tabs">
        <button class="tab-btn active" onclick="switchTab('jobs')">Gathered Tech Jobs</button>
        <button class="tab-btn" onclick="switchTab('companies')">Micro-Companies Directory</button>
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
        <select id="region-filter" class="region-select" onchange="applyFilters()">
          <option value="all" selected>🌐 Toàn bộ US & Remote (Tất cả 5 vùng)</option>
          <option value="midwest">📍 US-Midwest (IL, IN, WI, MN, OH...)</option>
          <option value="west">🌲 US-West (CA, WA, OR, NV...)</option>
          <option value="northeast">🗽 US-Northeast (NY, MA, PA, NJ...)</option>
          <option value="south">☀️ US-South (TX, FL, GA, NC, VA...)</option>
          <option value="mountain">🏔️ US-Mountain (CO, UT, AZ, ID...)</option>
          <option value="remote">🏠 100% Remote US</option>
        </select>
      </div>
    </div>

    <div id="tab-jobs" class="tab-content active">
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
          <span style="font-size: 22px;">✈️</span> Đăng nhập qua Telegram Bot
        </h3>
        <button class="modal-close-btn" onclick="closeModal('modal-login')">✕</button>
      </div>

      <p style="font-size: 13px; color: var(--text-muted); margin: 0 0 16px 0; text-align: left; line-height: 1.5;">
        Xác thực 1 chạm qua <strong>Telegram Bot</strong> để tự động nhận <strong>API Token MCP cá nhân</strong> miễn phí (dùng cho Cursor, Claude Desktop, Antigravity) và mở khóa tính năng lưu trữ nhiều bản CV theo từng Job JD.
      </p>

      <!-- Primary Action: Open Bot Button -->
      <div style="margin-bottom: 16px;">
        <a id="tg-bot-link" href="#" target="_blank" rel="noopener noreferrer" class="tg-bot-btn" onclick="onOpenBotClicked()">
          <span style="font-size: 20px;">✈️</span> Mở Telegram Bot để Đăng Nhập
        </a>
      </div>

      <!-- Live Sync Radar Box -->
      <div id="tg-sync-box" class="tg-sync-container">
        <div class="radar-spinner"></div>
        <div>
          <div id="tg-sync-title" style="font-weight: 600; font-size: 13px; color: #38bdf8;">
            Đang khởi tạo phiên kết nối bot...
          </div>
          <div id="tg-sync-subtitle" style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
            Sau khi mở bot, bạn chỉ cần bấm nút [Start] là xong!
          </div>
        </div>
      </div>

      <!-- Divider with QR option -->
      <div style="display: flex; align-items: center; margin: 18px 0 14px 0; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">
        <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.08);"></div>
        <span style="padding: 0 10px; color: var(--text-muted);">Hoặc quét mã QR bằng điện thoại</span>
        <div style="flex: 1; height: 1px; background: rgba(255,255,255,0.08);"></div>
      </div>

      <div style="display: flex; justify-content: center; margin-bottom: 14px;">
        <div style="background: white; padding: 8px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
          <img id="tg-qr-img" src="" alt="Telegram Login QR Code" style="width: 140px; height: 140px; display: block;" />
        </div>
      </div>

      <!-- Instant 1-click Demo / Test Fallback -->
      <div style="padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 11px; color: var(--text-muted);">Không tiện mở Telegram lúc này?</span>
        <button onclick="quickDemoLogin()" class="quick-demo-btn" id="btn-quick-demo">
          ⚡ Đăng nhập 1 chạm (Demo)
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

      <div style="background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.25); border-radius: 8px; padding: 12px; font-size: 12px; color: #d8b4fe;">
        <strong>6 Enabled AI Tools</strong>: <code>search_jobs</code>, <code>get_job_details</code>, <code>list_companies</code>, <code>list_user_cvs</code>, <code>tailor_cv_for_job</code>, <code>save_cv_version</code>.
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
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <p style="font-size: 13px; color: var(--text-muted);">
          Manage your master CV and tailored variations for different job descriptions.
        </p>
        <button onclick="toggleNewCvForm()" class="header-btn">+ Add New CV</button>
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

  <script>
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
        document.getElementById('stat-companies').innerText = (stats.companiesCount || 0).toLocaleString();
        document.getElementById('stat-jobs').innerText = (stats.jobsCount || 0).toLocaleString();
        document.getElementById('stat-senior').innerText = (stats.seniorCount || 0).toLocaleString();
        document.getElementById('stat-midwest').innerText = (stats.midwestPercent !== undefined ? stats.midwestPercent : 100) + '%';
        if (stats.regionalBreakdown) {
          const rb = stats.regionalBreakdown;
          if (document.getElementById('stat-reg-all')) document.getElementById('stat-reg-all').innerText = (stats.jobsCount || 0).toLocaleString();
          if (document.getElementById('stat-reg-midwest')) document.getElementById('stat-reg-midwest').innerText = (rb.midwest || 0).toLocaleString();
          if (document.getElementById('stat-reg-west')) document.getElementById('stat-reg-west').innerText = (rb.west || 0).toLocaleString();
          if (document.getElementById('stat-reg-northeast')) document.getElementById('stat-reg-northeast').innerText = (rb.northeast || 0).toLocaleString();
          if (document.getElementById('stat-reg-south')) document.getElementById('stat-reg-south').innerText = (rb.south || 0).toLocaleString();
          if (document.getElementById('stat-reg-mountain')) document.getElementById('stat-reg-mountain').innerText = (rb.mountain || 0).toLocaleString();
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
        let compUrl = '/api/companies?page=' + page + '&limit=30&paged=true';
        if (region && region !== 'all') compUrl += '&region=' + encodeURIComponent(region);

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
        return \`
        <div class="company-card \${isMidwestComp ? 'company-card-midwest' : ''}">
          <div class="company-header">
            <a class="company-name" href="\${c.websiteUrl}" target="_blank">\${c.name} ↗</a>
            <span class="company-badge">\${c.headcountEstimate || '1-20'} team</span>
          </div>
          <p class="company-desc">\${c.description || c.tagline || 'Independent tech company.'}</p>
          <div class="job-tags">
            \${getCompanyRegionBadge(c)}
            \${(c.techStack || []).slice(0, 5).map(s => \`<span class="tag">\${s}</span>\`).join('')}
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: auto;">
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
          return;
        }
      } catch (err) {
        console.warn('Auth check error:', err);
      }
      currentUser = null;
      renderAuthHeader();
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

      if (syncTitle) syncTitle.innerText = 'Đang khởi tạo kết nối với Telegram Bot...';
      if (syncSubtitle) syncSubtitle.innerText = 'Vui lòng chờ trong giây lát...';

      try {
        const res = await fetch('/api/auth/telegram/session');
        const data = await res.json();
        currentTgSession = data.sessionToken;

        if (botLink) {
          botLink.href = data.deepLink;
          botLink.innerHTML = '<span style="font-size: 20px;">✈️</span> Mở Bot @' + data.botUsername + ' để Đăng Nhập';
        }
        if (qrImg) {
          qrImg.src = data.qrUrl;
        }
        if (syncTitle) syncTitle.innerText = 'Đang chờ bạn nhấn [Start] trong Telegram...';
        if (syncSubtitle) syncSubtitle.innerText = 'Sau khi mở bot @' + data.botUsername + ', hãy nhấn nút [Start]';

        startTgPolling();
      } catch (err) {
        if (syncTitle) syncTitle.innerText = 'Lỗi kết nối bot: ' + err.message;
      }
    }

    function onOpenBotClicked() {
      const syncTitle = document.getElementById('tg-sync-title');
      if (syncTitle) syncTitle.innerHTML = '⚡ Đang đợi bạn nhấn [Start] trên Telegram...';
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
            if (syncTitle) syncTitle.innerHTML = '🎉 <span style="color: #34d399;">Đăng nhập thành công! Đang chuyển hướng...</span>';
            
            currentUser = data.user;
            setAuthToken(data.token || data.user.apiToken);
            setTimeout(() => {
              closeModal('modal-login');
              renderAuthHeader();
              fetchUserCvs();
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
        btn.innerText = 'Đang xử lý...';
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
          openMcpModal();
        } else {
          alert('Demo login failed: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Quick demo failed: ' + err.message);
      } finally {
        if (btn) {
          btn.innerText = '⚡ Đăng nhập 1 chạm (Demo)';
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
      renderAuthHeader();
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

      openModal('modal-mcp');
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
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 24px;">No CV versions saved yet. Click "+ Add New CV" or use "✨ Tailor CV" on any job card to create one.</p>';
        return;
      }

      container.innerHTML = userCvsList.map(cv => {
        const date = new Date(cv.updatedAt || cv.createdAt).toLocaleDateString();
        const scoreBadge = cv.matchScore != null ? ('<span class="tag" style="background: rgba(16, 185, 129, 0.2); color: #34d399; font-weight: 700;">🎯 ' + cv.matchScore + '% Match</span>') : '';
        const roleBadge = cv.targetRole ? ('<span class="tag">' + cv.targetRole + '</span>') : '';
        const skillsChips = (cv.skills || []).map(s => '<span class="tag tag-cat">' + s + '</span>').join(' ');

        return \`
          <div class="cv-card-item">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
              <div>
                <h4 style="font-size: 15px; font-weight: 700; color: #fff;">\${cv.title}</h4>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">Saved on \${date} \${cv.jobId ? '• Linked to Job ' + cv.jobId : ''}</div>
              </div>
              <div style="display: flex; gap: 6px; align-items: center;">
                \${scoreBadge}
                <button class="header-btn-secondary" onclick="deleteCv('\${cv.id}')" style="color: #f87171;">🗑️ Delete</button>
              </div>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
              \${roleBadge}
              \${skillsChips}
            </div>
            <div style="margin-top: 6px;">
              <details style="font-size: 12px; color: var(--text-muted);">
                <summary style="cursor: pointer; color: var(--primary);">View Markdown Content</summary>
                <div class="code-snippet" style="margin-top: 8px; max-height: 200px; overflow-y: auto;">\${cv.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
              </details>
            </div>
          </div>
        \`;
      }).join('');
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
