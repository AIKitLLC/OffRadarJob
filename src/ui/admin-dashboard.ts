export function renderAdminDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Control Center — OffRadarJob Crawl Process Management</title>
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
    .container { max-width: 1300px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--card-border);
      flex-wrap: wrap;
      gap: 16px;
    }
    .brand h1 {
      font-size: 24px;
      font-weight: 700;
      background: linear-gradient(135deg, #f43f5e, #38bdf8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand p { color: var(--text-muted); font-size: 13px; margin-top: 4px; }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .badge-admin {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(244, 63, 94, 0.15);
      color: #fda4af;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid rgba(244, 63, 94, 0.3);
      letter-spacing: 0.05em;
    }
    .btn-link {
      color: var(--primary);
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      padding: 6px 14px;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      background: var(--card-bg);
      transition: all 0.2s;
    }
    .btn-link:hover {
      background: rgba(56, 189, 248, 0.1);
      border-color: var(--primary);
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 8px;
      overflow-x: auto;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .tab-btn:hover {
      color: var(--text);
      background: rgba(255, 255, 255, 0.04);
    }
    .tab-btn.active {
      color: var(--primary);
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.3);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 16px 20px;
      position: relative;
      overflow: hidden;
    }
    .stat-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 4px; height: 100%;
      background: var(--primary);
    }
    .stat-card.running::before { background: var(--warning); }
    .stat-card.success::before { background: var(--success); }
    .stat-card.danger::before { background: var(--danger); }
    .stat-card.accent::before { background: var(--accent); }
    .stat-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-value { font-size: 26px; font-weight: 700; margin-top: 4px; color: #fff; font-family: 'JetBrains Mono', monospace; }

    /* Cards & Containers */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 22px;
      margin-bottom: 24px;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .card-title {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Forms */
    .form-group { margin-bottom: 14px; }
    .form-label { display: block; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }
    .form-input, .form-textarea, .form-select {
      width: 100%;
      background: #0d1424;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 10px 14px;
      color: var(--text);
      font-family: inherit;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s;
    }
    .form-input:focus, .form-textarea:focus, .form-select:focus {
      border-color: var(--primary);
    }
    .form-textarea {
      font-family: 'JetBrains Mono', monospace;
      min-height: 100px;
      resize: vertical;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: flex-end;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: var(--primary);
      color: #090d16;
      border: none;
      border-radius: 8px;
      padding: 10px 18px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .btn:hover { background: var(--primary-hover); }
    .btn-secondary {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--card-border);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--text-muted);
    }
    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #fca5a5;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .btn-danger:hover {
      background: var(--danger);
      color: #fff;
    }
    .btn-sm {
      padding: 5px 10px;
      font-size: 12px;
      border-radius: 6px;
    }

    /* Presets Grid */
    .presets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 14px;
      margin-top: 14px;
    }
    .preset-card {
      background: rgba(13, 20, 36, 0.7);
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 12px;
      transition: border-color 0.2s;
    }
    .preset-card:hover { border-color: var(--primary); }
    .preset-title { font-size: 14px; font-weight: 700; color: #fff; }
    .preset-desc { font-size: 12px; color: var(--text-muted); }

    /* Tables */
    .table-container {
      overflow-x: auto;
      border: 1px solid var(--card-border);
      border-radius: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: left;
    }
    th {
      background: #0d1424;
      color: var(--text-muted);
      font-weight: 600;
      padding: 12px 16px;
      border-bottom: 1px solid var(--card-border);
      white-space: nowrap;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(31, 42, 68, 0.6);
      vertical-align: middle;
    }
    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    /* Status Pills */
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      font-family: 'JetBrains Mono', monospace;
    }
    .pill-running {
      background: rgba(245, 158, 11, 0.15);
      color: #fcd34d;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .pill-completed {
      background: rgba(16, 185, 129, 0.15);
      color: #6ee7b7;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .pill-failed {
      background: rgba(239, 68, 68, 0.15);
      color: #fca5a5;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .pill-pending {
      background: rgba(148, 163, 184, 0.15);
      color: #cbd5e1;
      border: 1px solid rgba(148, 163, 184, 0.3);
    }
    .pulse-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: currentColor;
      animation: pulse 1.5s infinite;
    }

    /* Filters Bar */
    .filters-bar {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
      align-items: center;
    }

    /* Code Snippet */
    .code-text {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      background: rgba(0, 0, 0, 0.3);
      padding: 2px 6px;
      border-radius: 4px;
      color: #7dd3fc;
    }

    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--card-bg);
      border: 1px solid var(--primary);
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      display: none;
      z-index: 1000;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <h1>⚙️ OffRadarJob Control Center</h1>
        <p>Real-Time Crawl Process Management, Dispatching & Job Moderation</p>
      </div>
      <div class="header-actions">
        <span class="badge-admin">🛡️ Admin Mode</span>
        <button class="btn btn-secondary btn-sm" onclick="refreshAllData()">🔄 Refresh</button>
        <a href="/" class="btn-link">← Public Job Board</a>
      </div>
    </header>

    <!-- Navigation Tabs -->
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('tasks')">📊 Crawl Tasks Monitor (<span id="tab-tasks-count">0</span>)</button>
      <button class="tab-btn" onclick="switchTab('dispatch')">🚀 Dispatch Crawlers</button>
      <button class="tab-btn" onclick="switchTab('moderation')">📋 Job Moderation (<span id="tab-jobs-count">0</span>)</button>
      <button class="tab-btn" onclick="switchTab('telemetry')">📡 Error & DLQ Logs (<span id="tab-logs-count">0</span>)</button>
      <button class="tab-btn" onclick="switchTab('telegram')">🤖 Telegram Bot & Admins</button>
      <button class="tab-btn" onclick="switchTab('feedbacks')">💡 LLM Feedbacks (<span id="tab-feedbacks-count">0</span>)</button>
    </div>

    <!-- Real-time Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Crawl Tasks</div>
        <div class="stat-value" id="stat-total-tasks">0</div>
      </div>
      <div class="stat-card running">
        <div class="stat-label">Active / Running</div>
        <div class="stat-value" id="stat-running-tasks">0</div>
      </div>
      <div class="stat-card success">
        <div class="stat-label">Completed Tasks</div>
        <div class="stat-value" id="stat-completed-tasks">0</div>
      </div>
      <div class="stat-card danger">
        <div class="stat-label">Failed Tasks</div>
        <div class="stat-value" id="stat-failed-tasks">0</div>
      </div>
      <div class="stat-card accent">
        <div class="stat-label">Total Jobs Found</div>
        <div class="stat-value" id="stat-jobs-found">0</div>
      </div>
      <div class="stat-card" style="border-left: 3px solid var(--primary);">
        <div class="stat-label">⏱️ Last Crawl</div>
        <div class="stat-value" style="font-size: 18px; font-weight: 700; color: var(--primary);" id="stat-last-crawl">--</div>
      </div>
      <div class="stat-card success" style="border-left: 3px solid var(--success);">
        <div class="stat-label">🔄 24h Updates</div>
        <div class="stat-value" id="stat-updated-24h">0</div>
      </div>
      <div class="stat-card accent" style="border-left: 3px solid var(--accent);">
        <div class="stat-label">🆕 24h New Jobs</div>
        <div class="stat-value" id="stat-created-24h">0</div>
      </div>
      <div class="stat-card" style="border-left: 3px solid #38bdf8;">
        <div class="stat-label">🔔 Active Subscribers</div>
        <div class="stat-value" style="font-size: 19px; font-weight: 700; color: #38bdf8;" id="stat-subscribers">0 active</div>
      </div>
    </div>

    <!-- TAB 1: Crawl Tasks Monitor -->
    <div id="tab-tasks" class="tab-content">
      <!-- Automated Cadence & Freshness Banner -->
      <div class="card" style="margin-bottom: 20px; border-left: 4px solid var(--primary); background: linear-gradient(135deg, rgba(19, 27, 46, 0.95), rgba(15, 23, 42, 0.8));">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
          <div>
            <div style="font-size: 14px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px;">
              <span>⏰ Automated Ingestion Schedule (Cloudflare Cron Triggers)</span>
              <span class="pill pill-completed" style="font-size: 11px;">ALWAYS ACTIVE</span>
            </div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 6px; line-height: 1.6;">
              • <strong>Daily Sweep:</strong> <code>02:00 UTC</code> daily (candidate seeds & harvest Hacker News/GitHub).<br>
              • <strong>Weekly Sweep:</strong> <code>03:00 UTC</code> every Monday (re-crawl entire 940+ company database).<br>
              • <strong>Data Freshness:</strong> Automatically registers new companies and validates open/closed job statuses daily.
            </div>
          </div>
          <div style="display: flex; gap: 10px; align-items: center;">
            <button class="btn btn-sm" onclick="switchTab('dispatch')">⚡ Trigger Extra Ingest</button>
            <button class="btn btn-secondary btn-sm" onclick="refreshAllData()">🔄 Refresh</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <span>⚡ Crawl Processes & Execution Pipeline</span>
          </div>
          <div class="filters-bar" style="margin-bottom: 0;">
            <select id="filter-task-status" class="form-select" style="width: auto;" onchange="loadTasks()">
              <option value="all">All Statuses</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Target Website</th>
                <th>Source</th>
                <th>Jobs Found</th>
                <th>Duration / Error</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="tasks-table-body">
              <tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Loading crawl processes...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: Dispatch Crawlers -->
    <div id="tab-dispatch" class="tab-content" style="display: none;">
      <!-- Public Source Harvesters -->
      <div class="card" style="border: 1px solid rgba(168, 85, 247, 0.4); background: linear-gradient(135deg, rgba(26, 16, 43, 0.9), rgba(15, 23, 42, 0.9));">
        <div class="card-header">
          <div class="card-title">🌐 Public Source Harvesters (Hacker News & GitHub Repositories)</div>
          <span class="pill pill-running">🔥 Zero-API-Key Free Ingest</span>
        </div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
          Automatically harvest unlisted micro-companies, boutique tech studios & indie makers from open sources (Hacker News 'Who is Hiring' Algolia API & GitHub Open Repositories 880+ companies), then dispatch Agents to crawl and parse jobs directly from company career sites.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 8px;">
          <!-- HN Harvester -->
          <div style="background: rgba(13, 20, 36, 0.6); padding: 16px; border-radius: 10px; border: 1px solid var(--card-border);">
            <div style="font-size: 14px; font-weight: 700; color: #f97316; margin-bottom: 6px;">
              🟠 Hacker News "Who is Hiring?"
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
              Parse the latest Hacker News hiring thread. Extract company name, website, tech stack, hiring email, and direct application links.
            </p>
            <div class="form-row" style="margin-bottom: 0;">
              <input type="number" id="hn-harvest-limit" class="form-input" value="20" min="5" max="50" style="max-width: 80px;" title="Target company count">
              <button class="btn btn-sm" style="background: #f97316; color: #fff;" onclick="triggerHarvest('hn')">⚡ Harvest Hacker News</button>
            </div>
          </div>

          <!-- GitHub Harvester -->
          <div style="background: rgba(13, 20, 36, 0.6); padding: 16px; border-radius: 10px; border: 1px solid var(--card-border);">
            <div style="font-size: 14px; font-weight: 700; color: #38bdf8; margin-bottom: 6px;">
              🐙 GitHub Open Directories
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
              Ingest from curated directories of 880+ remote & boutique studios (remoteintech & established-remote). Enqueue companies and dispatch Agents to crawl.
            </p>
            <div class="form-row" style="margin-bottom: 0;">
              <input type="number" id="gh-harvest-limit" class="form-input" value="25" min="5" max="50" style="max-width: 80px;" title="Target company count">
              <button class="btn btn-sm" style="background: #0284c7; color: #fff;" onclick="triggerHarvest('github')">🐙 Harvest GitHub Repos</button>
            </div>
          </div>

          <!-- Full Harvest -->
          <div style="background: rgba(13, 20, 36, 0.6); padding: 16px; border-radius: 10px; border: 1px solid var(--card-border);">
            <div style="font-size: 14px; font-weight: 700; color: #a855f7; margin-bottom: 6px;">
              🚀 Multi-Source & Direct Crawl
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
              Combine both Hacker News & GitHub repositories. Ingest companies in parallel and dispatch background crawler agents.
            </p>
            <div class="form-row" style="margin-bottom: 0;">
              <input type="number" id="all-harvest-limit" class="form-input" value="30" min="10" max="60" style="max-width: 80px;" title="Total company count">
              <button class="btn btn-sm" style="background: #a855f7; color: #fff;" onclick="triggerHarvest('all')">🚀 Harvest All Sources</button>
            </div>
          </div>

          <!-- Cross-Industry US SMB Harvester & Auto-Scheduler -->
          <div style="background: rgba(13, 20, 36, 0.6); padding: 16px; border-radius: 10px; border: 1px solid #10b98144;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div style="font-size: 14px; font-weight: 700; color: #10b981;">
                🏢 Cross-Industry US SMBs (9 Sectors)
              </div>
              <span style="font-size: 10px; background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 2px 8px; border-radius: 9999px; border: 1px solid rgba(16, 185, 129, 0.3); font-weight: 600;">
                ⏱ Auto-Scheduled
              </span>
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
              Automatically crawl 41 curated US SMBs (2,800+ jobs) across 9 sectors: Health/Biotech, Cleantech, Robotics/Hardware, Fintech, Logistics, E-commerce, FoodTech, EdTech, HRTech.
            </p>
            <div class="form-row" style="margin-bottom: 0;">
              <button class="btn btn-sm" style="background: #10b981; color: #fff; width: 100%;" onclick="triggerHarvest('smb')">⚡ Harvest 41 Cross-Industry SMBs Now</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Presets -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">✨ 1-Click Preset Sweeps (Curated Off-Radar Targets)</div>
        </div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">
          Instantly dispatch crawls across targeted micro-companies, boutique engineering studios, and regional tech ecosystems.
        </p>
        <div class="presets-grid">
          <div class="preset-card">
            <div>
              <div class="preset-title">🌾 1. US-Midwest Tech Sweep (24 Companies)</div>
              <div class="preset-desc">Chicago, Minneapolis, Indianapolis, Ann Arbor, Madison, Cincinnati, Columbus (37signals, Basecamp, Six Feet Up, Atomic Object, Test Double...).</div>
            </div>
            <button class="btn btn-sm" onclick="triggerPreset('midwest')">Run Midwest Sweep 🚀</button>
          </div>
          <div class="preset-card">
            <div>
              <div class="preset-title">🤠 2. Texas & Southwest Hubs (16 Companies)</div>
              <div class="preset-desc">Austin, Dallas, Denver, Boulder, Salt Lake City (Modernize, FloSports, Liquibase, Automox, JumpCloud, Lucid...).</div>
            </div>
            <button class="btn btn-sm" style="background: #eab308; color: #000;" onclick="triggerPreset('texas_southwest')">Run Southwest Sweep 🚀</button>
          </div>
          <div class="preset-card">
            <div>
              <div class="preset-title">🗽 3. East Coast & NY/Boston (15 Companies)</div>
              <div class="preset-desc">New York City, Boston, Philadelphia, Raleigh-Durham NC (Thoughtbot, Viget, Alley, DockYard, Postlight, Pendo...).</div>
            </div>
            <button class="btn btn-sm" style="background: #06b6d4; color: #fff;" onclick="triggerPreset('east_coast')">Run East Coast Sweep 🚀</button>
          </div>
          <div class="preset-card">
            <div>
              <div class="preset-title">🌲 4. West Coast & PNW Studios (13 Companies)</div>
              <div class="preset-desc">Seattle, Portland, SF Bay Area boutique studios (Panic, MetaLab, Substantial, Linear, Resend, Mintlify, Raycast...).</div>
            </div>
            <button class="btn btn-sm" style="background: #10b981; color: #fff;" onclick="triggerPreset('west_coast')">Run West Coast Sweep 🚀</button>
          </div>
          <div class="preset-card">
            <div>
              <div class="preset-title">🤖 5. US AI & Systems Labs (15 Companies)</div>
              <div class="preset-desc">Modal, Replicate, Together AI, Groq, Cursor, Fly.io, Railway, Supabase, Neon, PlanetScale, Turso...</div>
            </div>
            <button class="btn btn-sm" style="background: #8b5cf6; color: #fff;" onclick="triggerPreset('ai_ml')">Run AI Sweep 🚀</button>
          </div>
          <div class="preset-card" style="border-color: rgba(56, 189, 248, 0.4); background: rgba(56, 189, 248, 0.05);">
            <div>
              <div class="preset-title">🇺🇸 6. Grand All-US SMB Sweep (90+ Companies)</div>
              <div class="preset-desc">Trigger simultaneous ingestion across all 90+ curated US small & medium companies into Cloudflare Queues / Background Runner.</div>
            </div>
            <button class="btn btn-sm" style="background: #38bdf8; color: #0f172a;" onclick="triggerPreset('all_us')">🇺🇸 Run All-US Grand Sweep 🚀</button>
          </div>
        </div>
      </div>

      <!-- Single URL Dispatch -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">🎯 Single Seed Crawl Dispatch</div>
        </div>
        <div class="form-row">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Target Website / Domain</label>
            <input type="text" id="single-url-input" class="form-input" placeholder="e.g. https://37signals.com or https://basecamp.com">
          </div>
          <div class="form-group" style="margin-bottom: 0; min-width: 150px;">
            <label class="form-label">Source Type</label>
            <select id="single-source-select" class="form-select">
              <option value="manual">Manual Admin</option>
              <option value="seed_list">Curated Seed</option>
              <option value="hn_whoishiring">Hacker News</option>
              <option value="github">GitHub Showcase</option>
            </select>
          </div>
          <button class="btn" onclick="dispatchSingleCrawl()">Dispatch Task 🚀</button>
        </div>
      </div>

      <!-- Batch Seed Dispatch -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">📦 Batch Seeds Dispatcher</div>
        </div>
        <div class="form-group">
          <label class="form-label">Paste URLs (one per line)</label>
          <textarea id="batch-urls-input" class="form-textarea" placeholder="https://example1.com&#10;https://example2.com&#10;https://example3.com"></textarea>
        </div>
        <button class="btn" onclick="dispatchBatchCrawl()">Dispatch Batch Tasks 📦</button>
      </div>

      <!-- Continuous Seeding, Initial Bulk Blast & Weekly Cron Section -->
      <div class="card" style="border: 1px solid rgba(56, 189, 248, 0.4); background: linear-gradient(135deg, rgba(19, 27, 46, 0.9), rgba(15, 23, 42, 0.9));">
        <div class="card-header">
          <div class="card-title">⚡ Initial Bulk Blast & Weekly Scheduled Automation</div>
          <div style="display: flex; gap: 8px;">
            <span class="pill pill-completed">⏰ Daily: 0 2 * * * (02:00 UTC)</span>
            <span class="pill pill-running">🔁 Weekly: 0 3 * * 1 (Mondays 03:00 UTC)</span>
          </div>
        </div>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
          For the first dataset ingestion, you can trigger <strong>Initial Bulk Blast</strong> to scan all curated small & medium companies across the US. Afterward, the system automatically sweeps <strong>weekly</strong> (every Monday at 03:00 UTC) to refresh jobs without manual intervention.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
          <!-- Card 1: Initial Simultaneous Bulk Sweep -->
          <div style="background: rgba(13, 20, 36, 0.6); padding: 16px; border-radius: 10px; border: 1px solid var(--card-border);">
            <div style="font-size: 14px; font-weight: 700; color: #38bdf8; margin-bottom: 6px;">
              🚀 First Run: Initial Simultaneous Bulk Blast
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
              Sweep all active companies in the database concurrently. Automatically shards work into parallel batches on Cloudflare Queues for maximum speed.
            </p>
            <button class="btn btn-sm" style="background: #0284c7; color: #fff;" onclick="triggerBulkSweepAll()">🚀 Run Initial Bulk Blast (All Companies)</button>
          </div>

          <!-- Card 2: Serverless Cloudflare Queues Feed -->
          <div style="background: rgba(13, 20, 36, 0.6); padding: 16px; border-radius: 10px; border: 1px solid var(--card-border);">
            <div style="font-size: 14px; font-weight: 700; color: #a855f7; margin-bottom: 6px;">
              ☁️ Queue 90+ US Curated Targets
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
              Push all 90+ curated companies (Midwest, Texas, East Coast, West Coast) into the background queue for asynchronous crawling.
            </p>
            <button class="btn btn-sm" style="background: #8b5cf6; color: #fff;" onclick="triggerBulkSeed()">🚀 Queue 90+ US Targets</button>
          </div>

          <!-- Card 3: Autonomous CLI Feeder -->
          <div style="background: rgba(13, 20, 36, 0.6); padding: 16px; border-radius: 10px; border: 1px solid var(--card-border);">
            <div style="font-size: 14px; font-weight: 700; color: #10b981; margin-bottom: 6px;">
              💻 Long-Running Terminal / VPS Runner
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
              Run directly from your local terminal or VPS with courteous rate-limit protection:
            </p>
            <div class="code-text" style="padding: 6px 10px; display: block; overflow-x: auto; color: #34d399;">
              npm run feed:continuous -- --duration=3 --interval=15
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">
              Continuous crawl over 3 hours with a 15s courteous delay between waves.
            </div>
          </div>

          <!-- Card 4: Weekly Continuous Scan & Freshness Sweep -->
          <div style="background: rgba(13, 20, 36, 0.6); padding: 16px; border-radius: 10px; border: 1px solid rgba(56, 189, 248, 0.4);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div style="font-size: 14px; font-weight: 700; color: #38bdf8;">
                📅 Weekly Scan & Freshness Sweep
              </div>
              <span style="font-size: 10px; background: rgba(56, 189, 248, 0.15); color: #7dd3fc; padding: 2px 8px; border-radius: 9999px; border: 1px solid rgba(56, 189, 248, 0.3); font-weight: 600;">
                🔁 Mon 03:00 UTC
              </span>
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
              Re-crawl all companies and direct ATS boards weekly (Cloudflare Cron <code>0 3 * * 1</code> + 1/7 rolling partition). Automatically detects new and closed roles.
            </p>
            <button class="btn btn-sm" style="background: #0284c7; color: #fff; width: 100%;" onclick="triggerWeeklySweep()">🔄 Run Weekly Continuous Scan Now</button>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: Job Moderation -->
    <div id="tab-moderation" class="tab-content" style="display: none;">
      <div class="card">
        <div class="card-header">
          <div class="card-title">📋 Extracted Jobs Moderation</div>
          <div class="filters-bar" style="margin-bottom: 0;">
            <select id="mod-filter-category" class="form-select" style="width: auto;" onchange="loadModerationJobs()">
              <option value="all">All Tech Disciplines</option>
              <option value="ai_ml">AI / ML</option>
              <option value="backend_systems">Backend & Systems</option>
              <option value="frontend_ui">Frontend & UI</option>
              <option value="fullstack">Fullstack</option>
              <option value="devops_cloud">DevOps & Cloud</option>
              <option value="product_design">Product & Design</option>
            </select>
            <select id="mod-filter-grade" class="form-select" style="width: auto;" onchange="loadModerationJobs()">
              <option value="all">All Seniority</option>
              <option value="founding">Founding</option>
              <option value="lead">Lead / Staff</option>
              <option value="senior">Senior</option>
              <option value="mid">Mid</option>
              <option value="junior">Junior</option>
              <option value="new_grad">New Grad</option>
              <option value="intern">Intern</option>
            </select>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Discipline</th>
                <th>Seniority</th>
                <th>Remote</th>
                <th>Status</th>
                <th>First Seen</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="moderation-jobs-body">
              <tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Loading jobs for moderation...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 4: Error & DLQ Logs -->
    <div id="tab-telemetry" class="tab-content" style="display: none;">
      <div class="card">
        <div class="card-header">
          <div class="card-title">📡 Crawl Telemetry & Error Inspection</div>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Agent</th>
                <th>Target URL</th>
                <th>Duration</th>
                <th>Message</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody id="telemetry-body">
              <tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Loading telemetry logs...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 5: Telegram Bot & Admin Configuration -->
    <div id="tab-telegram" class="tab-content" style="display: none;">
      
      <!-- Quick Setup Instruction Guide -->
      <div style="background: linear-gradient(135deg, rgba(0, 136, 204, 0.12), rgba(56, 189, 248, 0.05)); border: 1px solid rgba(0, 136, 204, 0.3); border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
          <div style="font-size: 24px;">✈️</div>
          <div style="font-size: 16px; font-weight: 700; color: #fff;">Direct Telegram Bot Configuration Guide (No Terminal Required)</div>
        </div>
        <p style="font-size: 13px; color: #bae6fd; margin-bottom: 12px; line-height: 1.5;">
          You can configure Bot Token, Bot Username, and Admin Permissions directly on this page. Configuration is persisted securely in Cloudflare D1.
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; font-size: 12px; color: #e0f2fe;">
          <div style="background: rgba(13, 20, 36, 0.6); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.15);">
            <strong style="color: #38bdf8;">1. Create Bot via @BotFather</strong><br/>
            Open a chat with <code>@BotFather</code> on Telegram, send <code>/newbot</code>, and copy your <strong>HTTP API Token</strong>.
          </div>
          <div style="background: rgba(13, 20, 36, 0.6); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.15);">
            <strong style="color: #38bdf8;">2. Paste Token & Save Configuration</strong><br/>
            Enter your Bot Token and Bot Username in the form below, then click <strong>💾 Save Configuration</strong>.
          </div>
          <div style="background: rgba(13, 20, 36, 0.6); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.15);">
            <strong style="color: #38bdf8;">3. Activate Webhook</strong><br/>
            Click <strong>🔗 Activate Webhook</strong> so Telegram automatically sends webhook updates to your Cloudflare Worker.
          </div>
          <div style="background: rgba(13, 20, 36, 0.6); padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(56, 189, 248, 0.15);">
            <strong style="color: #38bdf8;">4. Explore & Administrate</strong><br/>
            Chat <code>/start</code> or <code>/admin</code> with your bot to trigger crawlers, search jobs, and receive alerts.
          </div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 20px; margin-bottom: 24px;">
        <!-- Card 1: Configuration Form -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">⚙️ Telegram Bot & Webhook Setup (D1 Storage)</div>
            <button class="btn btn-secondary btn-sm" onclick="loadTelegramConfig()">🔄 Reload</button>
          </div>
          <div style="padding: 20px;">
            <div class="form-group">
              <label class="form-label" for="cfg-bot-token">
                Telegram Bot Token (HTTP API):
                <span id="cfg-token-status" style="margin-left: 8px; font-weight: normal; font-size: 11px; color: #38bdf8;"></span>
              </label>
              <div style="display: flex; gap: 8px;">
                <input type="password" id="cfg-bot-token" class="form-input" placeholder="Paste token from @BotFather: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ" autocomplete="off" />
                <button type="button" class="btn btn-secondary btn-sm" onclick="toggleTokenVisibility('cfg-bot-token', this)">👁️</button>
              </div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                Tokens are encrypted and masked as <code>123456...abcd</code> once saved.
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label class="form-label" for="cfg-bot-username">Bot Username:</label>
                <input type="text" id="cfg-bot-username" class="form-input" placeholder="e.g. OffRadarJobBot" />
              </div>
              <div class="form-group">
                <label class="form-label" for="cfg-admin-chat">Admin Alert Chat ID:</label>
                <input type="text" id="cfg-admin-chat" class="form-input" placeholder="e.g. 99887766 or @channel" />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="cfg-admin-usernames">Admin Usernames (comma-separated):</label>
              <input type="text" id="cfg-admin-usernames" class="form-input" placeholder="tuannx87, dev_lead, second_admin" />
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                These usernames will automatically be recognized as Administrators when interacting with the Bot.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="cfg-admin-token">
                Master Admin Access Token (Web & Bot):
                <span id="cfg-admin-token-status" style="margin-left: 8px; font-weight: normal; font-size: 11px; color: #38bdf8;"></span>
              </label>
              <div style="display: flex; gap: 8px;">
                <input type="password" id="cfg-admin-token" class="form-input" placeholder="Managed as a Cloudflare secret (wrangler secret put ADMIN_TOKEN)" disabled autocomplete="off" />
                <button type="button" class="btn btn-secondary btn-sm" onclick="toggleTokenVisibility('cfg-admin-token', this)">👁️</button>
              </div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                Secret access token used for Web Admin login (<code>?token=...</code>) and bot command <code>/admin auth &lt;token&gt;</code>.
              </div>
            </div>

            <div style="display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;">
              <button class="btn btn-primary" onclick="saveTelegramConfig()">💾 Save Configuration</button>
              <button class="btn btn-secondary" onclick="setupTgWebhook()">🔗 Activate Webhook</button>
              <button class="btn btn-secondary" onclick="checkWebhookInfo()">🔍 Check Webhook Info</button>
            </div>

            <!-- Webhook Diagnostic Status Card -->
            <div id="webhook-info-box" style="margin-top: 18px; display: none; background: #070c18; border: 1px solid var(--card-border); border-radius: 8px; padding: 14px; font-size: 12px;">
              <div style="font-weight: 700; color: #fff; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                <span>📡 Telegram Webhook Live Diagnostic:</span>
                <span id="webhook-info-badge" class="badge">Checking...</span>
              </div>
              <div id="webhook-info-details" style="font-family: 'JetBrains Mono', monospace; line-height: 1.6; color: #cbd5e1;"></div>
            </div>
          </div>
        </div>

        <!-- Card 2: Test Notification & Live Status -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">🔔 Connection Status & Test Alert</div>
          </div>
          <div style="padding: 20px;">
            <!-- Current Status Overview -->
            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
              <div style="width: 52px; height: 52px; border-radius: 50%; background: #0088cc22; border: 1px solid #0088cc; display: flex; align-items: center; justify-content: center; font-size: 26px;">✈️</div>
              <div>
                <div style="font-size: 16px; font-weight: 700; color: #fff;" id="tg-bot-handle">@OffRadarJobBot</div>
                <div style="font-size: 13px; color: #38bdf8;" id="tg-webhook-status">Checking webhook status...</div>
              </div>
            </div>

            <div style="background: var(--bg-card-alt); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px; font-size: 13px; line-height: 1.6; margin-bottom: 18px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: var(--text-muted);">Configured Admin Handles:</span>
                <strong style="color: #f59e0b;" id="tg-configured-admins">(none)</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: var(--text-muted);">Configured Admin IDs:</span>
                <strong style="color: #a78bfa;" id="tg-configured-ids">None (Any ID with username or token)</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Target Alert Chat ID:</span>
                <strong style="color: #10b981;" id="tg-alert-chat">Unconfigured</strong>
              </div>
            </div>

            <h4 style="font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 8px;">Send Test Notification</h4>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
              Send a direct test alert via Telegram Bot to verify API Token and Chat ID deliverability.
            </p>
            <div class="form-group">
              <input type="text" id="input-test-alert-msg" class="form-input" placeholder="Enter test alert message..." value="🚀 [OffRadarJob Alert] Crawler system & bot operating normally." />
            </div>
            <div style="display: flex; gap: 8px; margin-bottom: 16px;">
              <input type="text" id="input-test-alert-chat" class="form-input" placeholder="Recipient Chat ID (leave blank to use default Admin Chat ID)" style="font-size: 12px;" />
              <button class="btn btn-primary" onclick="sendTestAlert()">📢 Send Test</button>
            </div>

            <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 8px; padding: 12px; font-size: 12px; color: #bae6fd;">
              💡 <strong>Note:</strong> To allow the Bot to send messages to your user or group, you must open a conversation with the bot and send <strong>/start</strong> at least once first.
            </div>
          </div>
        </div>
      </div>

      <!-- User Role Management Table -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <div class="card-title">👥 User & Admin Access Management (<span id="tg-users-count">0</span>)</div>
          <button class="btn btn-secondary btn-sm" onclick="loadTelegramUsers()">🔄 Refresh Users</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Name / First Name</th>
                <th>Telegram Username</th>
                <th>Telegram ID</th>
                <th>Personal MCP Token</th>
                <th>Joined Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="tg-users-body">
              <tr><td colspan="7" style="text-align: center; color: var(--text-muted);">Loading users...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Bot Commands Reference -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">📖 Telegram Bot Commands Cheatsheet</div>
        </div>
        <div style="padding: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          <div style="background: var(--bg-card-alt); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: #38bdf8; font-size: 14px; margin-bottom: 6px;">📊 /stats</div>
            <div style="font-size: 12px; color: var(--text-muted);">View real-time report on jobs, companies, Midwest ratio, and recent crawl tasks.</div>
          </div>
          <div style="background: var(--bg-card-alt); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: #10b981; font-size: 14px; margin-bottom: 6px;">🕷️ /crawl &lt;url&gt;</div>
            <div style="font-size: 12px; color: var(--text-muted);">Trigger immediate crawl of a career page URL (auto-profile & extract jobs).</div>
          </div>
          <div style="background: var(--bg-card-alt); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: #f59e0b; font-size: 14px; margin-bottom: 6px;">⚡ /sweep</div>
            <div style="font-size: 12px; color: var(--text-muted);">Trigger batch sweep of top seed companies in background queue.</div>
          </div>
          <div style="background: var(--bg-card-alt); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: #a78bfa; font-size: 14px; margin-bottom: 6px;">🌾 /harvest [hn|github|all]</div>
            <div style="font-size: 12px; color: var(--text-muted);">Harvest company & job listings from Hacker News or GitHub repositories.</div>
          </div>
          <div style="background: var(--bg-card-alt); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: #ec4899; font-size: 14px; margin-bottom: 6px;">👥 /users</div>
            <div style="font-size: 12px; color: var(--text-muted);">Inspect total user count, admin count, and 5 most recent users.</div>
          </div>
          <div style="background: var(--bg-card-alt); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: #3b82f6; font-size: 14px; margin-bottom: 6px;">🔗 /adminlink</div>
            <div style="font-size: 12px; color: var(--text-muted);">Generate one-click magic URL for Web Admin Control Center.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 6: LLM Feedbacks Moderation & Quality Insights -->
    <div id="tab-feedbacks" class="tab-content" style="display: none;">
      <!-- Stats row -->
      <div class="stats-grid" style="margin-bottom: 20px;">
        <div class="stat-card">
          <div class="stat-label">Total Signals</div>
          <div class="stat-value" id="stat-fb-total">0</div>
        </div>
        <div class="stat-card running">
          <div class="stat-label">New / Pending</div>
          <div class="stat-value" id="stat-fb-new">0</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-label">Critical / Broken Links</div>
          <div class="stat-value" id="stat-fb-critical">0</div>
        </div>
        <div class="stat-card accent">
          <div class="stat-label">Candidate Preferences</div>
          <div class="stat-value" id="stat-fb-pref">0</div>
        </div>
        <div class="stat-card success">
          <div class="stat-label">Actioned / Resolved</div>
          <div class="stat-value" id="stat-fb-actioned">0</div>
        </div>
      </div>

      <!-- Filters -->
      <div class="card" style="margin-bottom: 20px;">
        <div class="card-header">
          <div class="card-title">🔍 Filter & Search Feedback Signals</div>
        </div>
        <div style="padding: 16px; display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
          <input type="text" id="fb-filter-search" placeholder="Search comments, suggested actions, context..." style="flex: 1; min-width: 200px; background: var(--bg); border: 1px solid var(--card-border); color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 13px;" onkeydown="if(event.key==='Enter') loadFeedbacks(1)" />
          <select id="fb-filter-type" style="background: var(--bg); border: 1px solid var(--card-border); color: var(--text); padding: 8px 12px; border-radius: 8px; font-size: 13px;">
            <option value="all">All Types</option>
            <option value="broken_link">🚨 Broken Link (404/Closed)</option>
            <option value="user_preference">🎯 Candidate Preference / Missing Stack</option>
            <option value="job_relevance">📋 Job Relevance / Category</option>
            <option value="missing_data">❓ Missing Data / Salary</option>
            <option value="cv_tailoring">📄 CV Tailoring Quality</option>
            <option value="general_suggestion">💡 General Suggestion</option>
          </select>
          <select id="fb-filter-sentiment" style="background: var(--bg); border: 1px solid var(--card-border); color: var(--text); padding: 8px 12px; border-radius: 8px; font-size: 13px;">
            <option value="all">All Sentiments</option>
            <option value="critical">🚨 Critical</option>
            <option value="negative">⚠️ Negative</option>
            <option value="neutral">💬 Neutral</option>
            <option value="positive">⭐ Positive</option>
          </select>
          <select id="fb-filter-status" style="background: var(--bg); border: 1px solid var(--card-border); color: var(--text); padding: 8px 12px; border-radius: 8px; font-size: 13px;">
            <option value="all">All Statuses</option>
            <option value="new">🆕 New</option>
            <option value="reviewed">👀 Reviewed</option>
            <option value="actioned">✅ Actioned</option>
            <option value="dismissed">🗑️ Dismissed</option>
          </select>
          <button class="btn btn-primary btn-sm" onclick="loadFeedbacks(1)">Apply Filters</button>
          <button class="btn btn-secondary btn-sm" onclick="resetFeedbackFilters()">Reset</button>
        </div>
      </div>

      <!-- Feedbacks Table -->
      <div class="card">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <div class="card-title">💡 Proactive LLM & User Feedback Feed</div>
          <button class="btn btn-secondary btn-sm" onclick="loadFeedbacks(1)">🔄 Refresh</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Time & User</th>
                <th>Type & Severity</th>
                <th>Comment & Context</th>
                <th>Linked Entity</th>
                <th>Suggested Action</th>
                <th>Status & Actions</th>
              </tr>
            </thead>
            <tbody id="fb-table-body">
              <tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Loading feedback records...</td></tr>
            </tbody>
          </table>
        </div>
        <!-- Pagination -->
        <div id="fb-pagination-bar" style="padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--card-border); font-size: 13px; color: var(--text-muted);">
          <span id="fb-pagination-info">Showing 0 of 0 records</span>
          <div style="display: flex; gap: 8px;">
            <button id="fb-prev-btn" class="btn btn-secondary btn-sm" onclick="prevFeedbackPage()" disabled>← Previous</button>
            <button id="fb-next-btn" class="btn btn-secondary btn-sm" onclick="nextFeedbackPage()" disabled>Next →</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="toast" class="toast"></div>

  <script>
    // Auth is the HttpOnly admin session cookie set by POST /admin/login; no token lives in page JS.
    const token = '';

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.style.display = 'block';
      setTimeout(() => { t.style.display = 'none'; }, 3500);
    }

    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      
      const activeBtn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick').includes(tabId));
      if (activeBtn) activeBtn.classList.add('active');
      
      const content = document.getElementById('tab-' + tabId);
      if (content) content.style.display = 'block';

      if (tabId === 'tasks') loadTasks();
      if (tabId === 'moderation') loadModerationJobs();
      if (tabId === 'telemetry') loadTelemetry();
      if (tabId === 'telegram') loadTelegramData();
      if (tabId === 'feedbacks') loadFeedbacks(1);
    }

    async function apiFetch(endpoint, options = {}) {
      options.headers = options.headers || {};
      if (token) options.headers['x-admin-token'] = token;
      options.credentials = 'same-origin';
      if (options.body && typeof options.body === 'object') {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
      }
      const separator = endpoint.includes('?') ? '&' : '?';
      return fetch(endpoint + separator + 'token=' + encodeURIComponent(token), options);
    }

    async function refreshAllData() {
      await Promise.all([
        loadStats(),
        loadTasks(),
        loadModerationJobs(),
        loadTelemetry(),
        loadTelegramData(),
        loadFeedbacks(currentFeedbackPage)
      ]);
      showToast("Data refreshed!");
    }

    async function loadStats() {
      try {
        const res = await apiFetch('/api/admin/stats');
        if (!res.ok) return;
        const data = await res.json();
        
        document.getElementById('stat-total-tasks').textContent = data.tasks?.total ?? 0;
        document.getElementById('stat-running-tasks').textContent = data.tasks?.running ?? 0;
        document.getElementById('stat-completed-tasks').textContent = data.tasks?.completed ?? 0;
        document.getElementById('stat-failed-tasks').textContent = data.tasks?.failed ?? 0;
        document.getElementById('stat-jobs-found').textContent = data.tasks?.jobsFound ?? data.jobsCount ?? 0;

        if (data.freshness) {
          const f = data.freshness;
          const lastEl = document.getElementById('stat-last-crawl');
          if (lastEl) {
            if (f.latestLastSeen) {
              const minsAgo = Math.max(0, Math.round((Date.now() - f.latestLastSeen) / 60000));
              lastEl.textContent = minsAgo < 60 ? minsAgo + 'm ago' : Math.round(minsAgo / 60) + 'h ago';
              lastEl.title = new Date(f.latestLastSeen).toISOString();
            } else {
              lastEl.textContent = 'None yet';
            }
          }
          const upEl = document.getElementById('stat-updated-24h');
          if (upEl) upEl.textContent = Number(f.updatedLast24h || 0).toLocaleString();
          const crEl = document.getElementById('stat-created-24h');
          if (crEl) crEl.textContent = Number(f.createdLast24h || 0).toLocaleString();
        }

        if (data.subscribers) {
          const subEl = document.getElementById('stat-subscribers');
          if (subEl) subEl.textContent = (data.subscribers.active || 0) + ' active (' + (data.subscribers.total || 0) + ' total)';
        }

        document.getElementById('tab-tasks-count').textContent = data.tasks?.total ?? 0;
        document.getElementById('tab-jobs-count').textContent = data.jobsCount ?? 0;
        document.getElementById('tab-logs-count').textContent = data.logsCount ?? 0;

        // Fetch feedback stats
        apiFetch('/api/admin/feedbacks?limit=1').then(r => r.json()).then(fbData => {
          if (fbData.stats) {
            const countEl = document.getElementById('tab-feedbacks-count');
            if (countEl) countEl.textContent = fbData.stats.total ?? 0;
            const newEl = document.getElementById('stat-fb-new');
            if (newEl) newEl.textContent = fbData.stats.newCount ?? 0;
            const critEl = document.getElementById('stat-fb-critical');
            if (critEl) critEl.textContent = fbData.stats.criticalCount ?? 0;
            const prefEl = document.getElementById('stat-fb-pref');
            if (prefEl) prefEl.textContent = fbData.stats.userPrefCount ?? 0;
            const actEl = document.getElementById('stat-fb-actioned');
            if (actEl) actEl.textContent = fbData.stats.actionedCount ?? 0;
            const totEl = document.getElementById('stat-fb-total');
            if (totEl) totEl.textContent = fbData.stats.total ?? 0;
          }
        }).catch(() => {});
      } catch (err) {
        console.error("Failed to load stats:", err);
      }
    }

    async function loadTasks() {
      const status = document.getElementById('filter-task-status')?.value || 'all';
      try {
        const url = status === 'all' ? '/api/admin/tasks' : '/api/admin/tasks?status=' + status;
        const res = await apiFetch(url);
        if (!res.ok) return;
        const tasks = await res.json();

        const tbody = document.getElementById('tasks-table-body');
        if (!tasks || tasks.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No crawl tasks matching criteria.</td></tr>';
          return;
        }

        tbody.innerHTML = tasks.map(t => {
          let pillClass = 'pill-pending';
          let pulseHtml = '';
          if (t.status === 'running') {
            pillClass = 'pill-running';
            pulseHtml = '<span class="pulse-dot"></span>';
          } else if (t.status === 'completed') {
            pillClass = 'pill-completed';
          } else if (t.status === 'failed') {
            pillClass = 'pill-failed';
          }

          const timeAgo = Math.round((Date.now() - t.createdAt) / 1000 / 60);
          const timeStr = timeAgo < 1 ? 'just now' : timeAgo + 'm ago';

          return \`<tr>
            <td><span class="pill \${pillClass}">\${pulseHtml} \${t.status.toUpperCase()}</span></td>
            <td><strong style="color: #fff;">\${escapeHtml(t.targetUrl)}</strong></td>
            <td><span class="code-text">\${escapeHtml(t.sourceType)}</span></td>
            <td><strong style="color: var(--primary);">\${t.jobsFound}</strong></td>
            <td>\${t.errorMessage ? '<span style="color: var(--danger);">' + escapeHtml(t.errorMessage) + '</span>' : '<span style="color: var(--success);">OK</span>'}</td>
            <td style="color: var(--text-muted); font-size: 12px;">\${timeStr}</td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="reRunTask('\${escapeHtml(t.targetUrl)}')">Re-crawl 🔄</button>
            </td>
          </tr>\`;
        }).join('');
      } catch (err) {
        console.error("Failed to load tasks:", err);
      }
    }

    async function loadModerationJobs() {
      const cat = document.getElementById('mod-filter-category')?.value || 'all';
      const grade = document.getElementById('mod-filter-grade')?.value || 'all';

      try {
        const query = new URLSearchParams({ limit: '50' });
        if (cat !== 'all') query.set('tech_category', cat);
        if (grade !== 'all') query.set('grade', grade);

        const res = await apiFetch('/api/jobs?' + query.toString());
        const data = await res.json();
        const jobs = Array.isArray(data) ? data : (data?.items || []);

        const tbody = document.getElementById('moderation-jobs-body');
        if (!jobs || jobs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No jobs found.</td></tr>';
          return;
        }

        tbody.innerHTML = jobs.map(j => {
          const isClosed = j.status === 'closed';
          const statusPill = isClosed 
            ? '<span class="pill pill-failed">CLOSED</span>' 
            : '<span class="pill pill-completed">OPEN</span>';

          return \`<tr>
            <td>
              <strong style="color: #fff;">\${escapeHtml(j.title)}</strong>
              <div style="font-size: 11px; color: var(--text-muted);">ID: \${escapeHtml(j.id)}</div>
            </td>
            <td><span class="code-text">\${escapeHtml(j.techCategory)}</span></td>
            <td><span class="pill pill-pending">\${escapeHtml(j.seniorityLevel)}</span></td>
            <td>\${j.isRemote ? '🌐 Remote' : '🏢 ' + escapeHtml(j.location || 'Onsite')}</td>
            <td>\${statusPill}</td>
            <td style="color: var(--text-muted); font-size: 12px;">\${new Date(j.firstSeenAt).toLocaleDateString()}</td>
            <td>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-secondary btn-sm" onclick="toggleJobStatus('\${j.id}', '\${isClosed ? 'open' : 'closed'}')">
                  \${isClosed ? 'Reopen' : 'Close'}
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteJob('\${j.id}')">Delete</button>
              </div>
            </td>
          </tr>\`;
        }).join('');
      } catch (err) {
        console.error("Failed to load moderation jobs:", err);
      }
    }

    async function loadTelemetry() {
      try {
        const res = await apiFetch('/api/stats');
        if (!res.ok) return;
        const data = await res.json();

        const tbody = document.getElementById('telemetry-body');
        const logs = data.recentLogs || [];
        if (logs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No logs available.</td></tr>';
          return;
        }

        tbody.innerHTML = logs.map(l => {
          let pillClass = 'pill-completed';
          if (l.status === 'warning') pillClass = 'pill-running';
          if (l.status === 'error') pillClass = 'pill-failed';

          return \`<tr>
            <td><span class="pill \${pillClass}">\${l.status.toUpperCase()}</span></td>
            <td><span class="code-text">\${escapeHtml(l.agentName)}</span></td>
            <td>\${escapeHtml(l.targetUrl)}</td>
            <td>\${l.durationMs}ms</td>
            <td style="color: var(--text-muted);">\${escapeHtml(l.message)}</td>
            <td style="font-size: 12px; color: var(--text-muted);">\${new Date(l.createdAt).toLocaleTimeString()}</td>
          </tr>\`;
        }).join('');
      } catch (err) {
        console.error("Failed to load telemetry:", err);
      }
    }

    async function dispatchSingleCrawl() {
      const url = document.getElementById('single-url-input').value.trim();
      const source = document.getElementById('single-source-select').value;
      if (!url) {
        alert("Please enter a valid website URL or domain.");
        return;
      }

      showToast("Dispatching crawl task for " + url + "...");
      const res = await apiFetch('/api/admin/tasks/create', {
        method: 'POST',
        body: { url, source }
      });

      if (res.ok) {
        showToast("Task dispatched successfully!");
        document.getElementById('single-url-input').value = '';
        switchTab('tasks');
        loadStats();
      } else {
        const err = await res.json();
        alert("Error dispatching task: " + (err.error || "Unknown error"));
      }
    }

    async function dispatchBatchCrawl() {
      const text = document.getElementById('batch-urls-input').value.trim();
      if (!text) {
        alert("Please paste at least one URL.");
        return;
      }

      const urls = text.split('\\n').map(u => u.trim()).filter(Boolean);
      showToast("Dispatching batch of " + urls.length + " seeds...");

      const res = await apiFetch('/api/admin/tasks/batch', {
        method: 'POST',
        body: { urls, source: 'batch_admin' }
      });

      if (res.ok) {
        showToast("Batch dispatched successfully!");
        document.getElementById('batch-urls-input').value = '';
        switchTab('tasks');
        loadStats();
      } else {
        const err = await res.json();
        alert("Error dispatching batch: " + (err.error || "Unknown error"));
      }
    }

    async function triggerPreset(presetType) {
      showToast("Launching " + presetType + " preset sweep...");
      const res = await apiFetch('/api/admin/tasks/preset', {
        method: 'POST',
        body: { preset: presetType }
      });

      if (res.ok) {
        showToast("Preset sweep dispatched!");
        switchTab('tasks');
        loadStats();
      } else {
        const err = await res.json();
        alert("Error: " + (err.error || "Unknown error"));
      }
    }

    async function triggerBulkSeed() {
      if (!confirm("Queue all curated micro-company targets for continuous serverless background crawling?")) return;
      showToast("Dispatching curated catalogue to Cloudflare Queues...");
      const res = await apiFetch('/api/admin/tasks/bulk-seed', {
        method: 'POST',
        body: {}
      });
      if (res.ok) {
        const data = await res.json();
        showToast("Dispatched " + data.totalEnqueued + " tasks to Cloudflare Queues!");
        switchTab('tasks');
        loadStats();
      } else {
        const err = await res.json();
        alert("Error: " + (err.error || "Failed to dispatch bulk seed"));
      }
    }

    async function triggerBulkSweepAll() {
      if (!confirm("Trigger Initial Bulk Blast to sweep ALL companies currently stored in the database?")) return;
      showToast("Dispatching simultaneous sweep across ALL companies...");
      const res = await apiFetch('/api/admin/tasks/bulk-sweep-all', {
        method: 'POST',
        body: { limit: 300 }
      });
      if (res.ok) {
        const data = await res.json();
        showToast("Dispatched " + data.dispatchedTasks + " simultaneous tasks across all tracked companies!");
        switchTab('tasks');
        loadStats();
      } else {
        const err = await res.json();
        alert("Error: " + (err.error || "Failed to dispatch bulk sweep all"));
      }
    }

    async function triggerWeeklySweep() {
      showToast("Dispatching weekly continuous scan across companies and ATS boards...");
      const res = await apiFetch('/api/admin/tasks/weekly-sweep', {
        method: 'POST',
        body: { limit: 350 }
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message || "Weekly sweep dispatched successfully!");
        switchTab('tasks');
        loadStats();
      } else {
        const err = await res.json();
        alert("Error: " + (err.error || "Failed to trigger weekly sweep"));
      }
    }

    async function triggerHarvest(source) {
      if (source === 'smb') {
        showToast("Triggering Cross-Industry US SMB Gatherer (41 targets across 9 sectors)...");
        const res = await apiFetch('/api/admin/harvest/smb', { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          showToast(data.message || "SMB sweep dispatched in background!");
          switchTab('tasks');
          loadStats();
        } else {
          const err = await res.json();
          alert("Error: " + (err.error || "Failed to trigger SMB harvest"));
        }
        return;
      }

      let limit = 20;
      if (source === 'hn') {
        limit = parseInt(document.getElementById('hn-harvest-limit').value, 10) || 20;
      } else if (source === 'github') {
        limit = parseInt(document.getElementById('gh-harvest-limit').value, 10) || 25;
      } else {
        limit = parseInt(document.getElementById('all-harvest-limit').value, 10) || 30;
      }

      showToast("Triggering " + source.toUpperCase() + " public sources harvest (limit: " + limit + ")...");
      const res = await apiFetch('/api/admin/harvest/' + source, {
        method: 'POST',
        body: { limit }
      });

      if (res.ok) {
        const data = await res.json();
        showToast(data.message || "Harvest dispatched successfully!");
        switchTab('tasks');
        loadStats();
      } else {
        const err = await res.json();
        alert("Error: " + (err.error || "Failed to trigger harvest"));
      }
    }

    async function reRunTask(url) {
      showToast("Re-crawling " + url + "...");
      const res = await apiFetch('/api/admin/tasks/create', {
        method: 'POST',
        body: { url, source: 'manual_retry' }
      });
      if (res.ok) {
        showToast("Re-crawl task created!");
        loadTasks();
        loadStats();
      }
    }

    async function toggleJobStatus(jobId, newStatus) {
      const res = await apiFetch('/api/admin/jobs/' + jobId + '/status', {
        method: 'PATCH',
        body: { status: newStatus }
      });

      if (res.ok) {
        showToast("Job status updated to " + newStatus);
        loadModerationJobs();
      }
    }

    async function deleteJob(jobId) {
      if (!confirm("Are you sure you want to permanently delete this job?")) return;

      const res = await apiFetch('/api/admin/jobs/' + jobId, {
        method: 'DELETE'
      });

      if (res.ok) {
        showToast("Job deleted.");
        loadModerationJobs();
        loadStats();
      }
    }

    // --- TELEGRAM BOT & SYSTEM CONFIGURATION ---
    async function loadTelegramConfig() {
      try {
        const res = await apiFetch('/api/admin/telegram/config');
        if (res.ok) {
          const cfg = await res.json();
          const tokenInput = document.getElementById('cfg-bot-token');
          const tokenStatus = document.getElementById('cfg-token-status');
          if (tokenInput && tokenStatus) {
            if (cfg.hasBotToken) {
              tokenInput.placeholder = 'Saved: ' + cfg.botTokenMasked + ' (Enter new value to update)';
              tokenStatus.textContent = '✅ Configured (' + cfg.botTokenMasked + ')';
              tokenStatus.style.color = '#10b981';
            } else {
              tokenInput.placeholder = 'Paste token from @BotFather: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ';
              tokenStatus.textContent = '⚠️ Unconfigured';
              tokenStatus.style.color = '#f59e0b';
            }
          }

          const uInput = document.getElementById('cfg-bot-username');
          if (uInput && cfg.botUsername) uInput.value = cfg.botUsername;

          const admInput = document.getElementById('cfg-admin-usernames');
          if (admInput && cfg.adminUsernames) admInput.value = cfg.adminUsernames;

          const chatInput = document.getElementById('cfg-admin-chat');
          if (chatInput && cfg.adminChatId) chatInput.value = cfg.adminChatId;

          const adminTokenInput = document.getElementById('cfg-admin-token');
          const adminTokenStatus = document.getElementById('cfg-admin-token-status');
          if (adminTokenInput && adminTokenStatus && cfg.adminTokenMasked) {
            adminTokenInput.placeholder = 'Saved: ' + cfg.adminTokenMasked + ' (Enter new value to change)';
            adminTokenStatus.textContent = '✅ Configured (' + cfg.adminTokenMasked + ')';
            adminTokenStatus.style.color = '#10b981';
          }
        }
      } catch (err) {
        console.error("Failed loading telegram config:", err);
      }
    }

    async function saveTelegramConfig() {
      try {
        const botToken = document.getElementById('cfg-bot-token').value.trim();
        const botUsername = document.getElementById('cfg-bot-username').value.trim();
        const adminUsernames = document.getElementById('cfg-admin-usernames').value.trim();
        const adminChatId = document.getElementById('cfg-admin-chat').value.trim();
        const adminTokenVal = document.getElementById('cfg-admin-token').value.trim();

        showToast("Saving configuration to Cloudflare D1...");
        const res = await apiFetch('/api/admin/telegram/config', {
          method: 'POST',
          body: {
            botToken: botToken || undefined,
            botUsername: botUsername || undefined,
            adminUsernames: adminUsernames || undefined,
            adminChatId: adminChatId || undefined,
            adminToken: adminTokenVal || undefined,
          }
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showToast("✅ Telegram configuration saved successfully!");
          document.getElementById('cfg-bot-token').value = '';
          document.getElementById('cfg-admin-token').value = '';
          await loadTelegramConfig();
          await loadTelegramData();
          checkWebhookInfo();
        } else {
          showToast("Save error: " + (data.error || "Unable to update"));
        }
      } catch (err) {
        showToast("Network error saving configuration.");
      }
    }

    async function checkWebhookInfo() {
      const box = document.getElementById('webhook-info-box');
      const badge = document.getElementById('webhook-info-badge');
      const details = document.getElementById('webhook-info-details');
      if (!box || !badge || !details) return;

      box.style.display = 'block';
      badge.textContent = 'Checking...';
      badge.style.background = 'rgba(56, 189, 248, 0.2)';
      badge.style.color = '#38bdf8';
      details.innerHTML = 'Querying Telegram API...';

      try {
        const res = await apiFetch('/api/telegram/webhook-info');
        const data = await res.json();
        if (!res.ok || !data.ok) {
          badge.textContent = 'Connection Error';
          badge.style.background = 'rgba(239, 68, 68, 0.2)';
          badge.style.color = '#ef4444';
          details.innerHTML = '❌ ' + escapeHtml(data.error || data.description || 'Unable to connect to Telegram Bot API. Please check your Bot Token.');
          return;
        }

        const info = data.result || {};
        const hasUrl = !!info.url;
        badge.textContent = hasUrl ? 'Active' : 'No Webhook Set';
        badge.style.background = hasUrl ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)';
        badge.style.color = hasUrl ? '#10b981' : '#f59e0b';

        let html = '';
        html += '<div>• <strong>Webhook URL:</strong> ' + (info.url ? '<code>' + escapeHtml(info.url) + '</code>' : '<span style="color:#f59e0b;">Not set (Click "Activate Webhook" button)</span>') + '</div>';
        html += '<div>• <strong>Custom Certificate:</strong> ' + (info.has_custom_certificate ? 'Yes' : 'No (Cloudflare SSL)') + '</div>';
        html += '<div>• <strong>Pending Updates:</strong> ' + (info.pending_update_count || 0) + '</div>';
        if (info.ip_address) {
          html += '<div>• <strong>Resolved IP:</strong> <code>' + escapeHtml(info.ip_address) + '</code></div>';
        }
        if (info.last_error_date) {
          const errDate = new Date(info.last_error_date * 1000).toLocaleString();
          html += '<div style="color: #ef4444; margin-top: 4px;">• <strong>Latest Error:</strong> ' + escapeHtml(info.last_error_message || 'N/A') + ' (' + errDate + ')</div>';
        } else {
          html += '<div style="color: #10b981; margin-top: 4px;">• <strong>Status:</strong> Healthy, zero errors.</div>';
        }
        details.innerHTML = html;
      } catch (err) {
        badge.textContent = 'Error';
        details.innerHTML = '❌ Network error checking Webhook info.';
      }
    }

    function toggleTokenVisibility(inputId, btn) {
      const input = document.getElementById(inputId);
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🔒';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    }

    // --- TELEGRAM BOT & ADMIN MANAGEMENT ---
    async function loadTelegramData() {
      try {
        await loadTelegramConfig();
        const res = await apiFetch('/api/admin/telegram/status');
        if (res.ok) {
          const data = await res.json();
          document.getElementById('tg-bot-handle').textContent = '@' + data.botUsername;
          document.getElementById('tg-configured-admins').textContent = data.configuredAdmins.map(a => '@' + a).join(', ') || 'None';
          document.getElementById('tg-configured-ids').textContent = data.configuredAdminIds.join(', ') || 'None (Any ID with username or token)';
          document.getElementById('tg-alert-chat').textContent = data.adminChatId || 'Unconfigured';
          document.getElementById('tg-webhook-status').textContent = data.hasBotToken ? '✅ Bot Token Configured' : '⚠️ Token Not Configured';
        }
        await loadTelegramUsers();
      } catch (err) {
        console.error("Failed loading telegram status:", err);
      }
    }

    async function loadTelegramUsers() {
      const tbody = document.getElementById('tg-users-body');
      try {
        const res = await apiFetch('/api/admin/users');
        if (!res.ok) return;
        const data = await res.json();
        const users = data.users || [];
        document.getElementById('tg-users-count').textContent = users.length;

        if (users.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No users found.</td></tr>';
          return;
        }

        tbody.innerHTML = users.map(function(u) {
          var isAdmin = u.role === 'admin';
          var roleBadge = isAdmin 
            ? '<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid #f59e0b;">👑 Admin</span>'
            : '<span class="badge" style="background: rgba(100, 116, 139, 0.2); color: #94a3b8; border: 1px solid #475569;">👤 User</span>';
          
          var targetRole = isAdmin ? 'user' : 'admin';
          var btnText = isAdmin ? 'Revoke Admin' : 'Grant Admin 👑';
          var btnClass = isAdmin ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm';
          var actionBtn = '<button class="' + btnClass + '" onclick="toggleUserRole(&quot;' + escapeHtml(u.id) + '&quot;, &quot;' + targetRole + '&quot;)">' + btnText + '</button>';

          var dateStr = u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A';
          var tgHandle = u.username ? '@' + escapeHtml(u.username) : '<span style="color:var(--text-muted);">-</span>';
          var tokenDisplay = u.apiToken ? u.apiToken.slice(0, 10) + '...' : '';

          return '<tr>' +
            '<td>' + roleBadge + '</td>' +
            '<td><strong>' + escapeHtml(u.firstName) + '</strong></td>' +
            '<td>' + tgHandle + '</td>' +
            '<td><code>' + escapeHtml(u.telegramId) + '</code></td>' +
            '<td><code>' + escapeHtml(tokenDisplay) + '</code></td>' +
            '<td style="color: var(--text-muted);">' + dateStr + '</td>' +
            '<td>' + actionBtn + '</td>' +
          '</tr>';
        }).join('');
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--danger);">Failed loading users.</td></tr>';
      }
    }

    async function toggleUserRole(userId, newRole) {
      if (!confirm("Are you sure you want to set this user role to " + newRole.toUpperCase() + "?")) return;
      try {
        const res = await apiFetch('/api/admin/users/' + encodeURIComponent(userId) + '/role', {
          method: 'POST',
          body: { role: newRole }
        });
        if (res.ok) {
          showToast("User role updated to " + newRole + "!");
          loadTelegramUsers();
        } else {
          showToast("Failed updating user role.");
        }
      } catch (err) {
        showToast("Error updating user role.");
      }
    }

    async function setupTgWebhook() {
      try {
        showToast("Setting up Telegram webhook...");
        const res = await fetch('/api/telegram/setup-webhook', { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.result?.ok) {
          showToast("✅ Telegram Webhook registered successfully!");
          await loadTelegramData();
          checkWebhookInfo();
        } else {
          showToast("Webhook setup: " + (data.error || data.result?.description || "Failed"));
        }
      } catch (err) {
        showToast("Error connecting to webhook setup endpoint.");
      }
    }

    async function sendTestAlert() {
      const msgInput = document.getElementById('input-test-alert-msg');
      const chatInput = document.getElementById('input-test-alert-chat');
      const message = msgInput?.value.trim();
      const chatId = chatInput?.value.trim() || undefined;
      if (!message) return;

      try {
        showToast("Sending test notification...");
        const res = await apiFetch('/api/admin/telegram/test-notify', {
          method: 'POST',
          body: { message, chatId }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("📢 Test notification sent to Telegram!");
        } else {
          showToast("Failed to send alert: " + (data.error || "Check TELEGRAM_BOT_TOKEN"));
        }
      } catch (err) {
        showToast("Error triggering test alert.");
      }
    }

    // --- LLM Feedback Moderation & Analysis ---
    let currentFeedbackPage = 1;
    let totalFeedbackPages = 1;

    async function loadFeedbacks(page = 1) {
      currentFeedbackPage = page;
      const type = document.getElementById('fb-filter-type')?.value || 'all';
      const sentiment = document.getElementById('fb-filter-sentiment')?.value || 'all';
      const status = document.getElementById('fb-filter-status')?.value || 'all';
      const search = document.getElementById('fb-filter-search')?.value.trim() || '';

      const queryParams = new URLSearchParams({
        page: String(page),
        limit: '15',
        type,
        sentiment,
        status,
      });
      if (search) queryParams.set('search', search);

      const tbody = document.getElementById('fb-table-body');
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Loading feedback records...</td></tr>';

      try {
        const res = await apiFetch('/api/admin/feedbacks?' + queryParams.toString());
        if (!res.ok) {
          if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 30px;">Failed to load feedbacks.</td></tr>';
          return;
        }

        const data = await res.json();
        const items = data.items || [];
        totalFeedbackPages = data.pagination?.totalPages || 1;

        // Update stats
        if (data.stats) {
          const countEl = document.getElementById('tab-feedbacks-count');
          if (countEl) countEl.textContent = data.stats.total ?? 0;
          const newEl = document.getElementById('stat-fb-new');
          if (newEl) newEl.textContent = data.stats.newCount ?? 0;
          const critEl = document.getElementById('stat-fb-critical');
          if (critEl) critEl.textContent = data.stats.criticalCount ?? 0;
          const prefEl = document.getElementById('stat-fb-pref');
          if (prefEl) prefEl.textContent = data.stats.userPrefCount ?? 0;
          const actEl = document.getElementById('stat-fb-actioned');
          if (actEl) actEl.textContent = data.stats.actionedCount ?? 0;
          const totEl = document.getElementById('stat-fb-total');
          if (totEl) totEl.textContent = data.stats.total ?? 0;
        }

        // Pagination bar
        const infoEl = document.getElementById('fb-pagination-info');
        if (infoEl) {
          const total = data.pagination?.total || 0;
          const start = total === 0 ? 0 : (page - 1) * 15 + 1;
          const end = Math.min(page * 15, total);
          infoEl.textContent = 'Showing ' + start + '-' + end + ' of ' + total + ' records (Page ' + page + ' of ' + totalFeedbackPages + ')';
        }
        const prevBtn = document.getElementById('fb-prev-btn');
        const nextBtn = document.getElementById('fb-next-btn');
        if (prevBtn) prevBtn.disabled = page <= 1;
        if (nextBtn) nextBtn.disabled = page >= totalFeedbackPages;

        if (items.length === 0) {
          if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px;">No feedback signals found matching current filters.</td></tr>';
          return;
        }

        if (tbody) {
          tbody.innerHTML = items.map(function(fb) {
            const timeStr = new Date(fb.createdAt).toLocaleDateString() + ' ' + new Date(fb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const userHandle = fb.username ? '@' + escapeHtml(fb.username) : (fb.userFirstName || fb.userId.slice(-8));

            let typeBadgeColor = 'rgba(56, 189, 248, 0.15)';
            let typeTextColor = '#38bdf8';
            if (fb.feedbackType === 'broken_link') { typeBadgeColor = 'rgba(239, 68, 68, 0.15)'; typeTextColor = '#ef4444'; }
            if (fb.feedbackType === 'user_preference') { typeBadgeColor = 'rgba(168, 85, 247, 0.15)'; typeTextColor = '#a855f7'; }
            if (fb.feedbackType === 'cv_tailoring') { typeBadgeColor = 'rgba(16, 185, 129, 0.15)'; typeTextColor = '#10b981'; }

            let sentBadge = '💬 Neutral';
            let sentClass = 'color: #94a3b8;';
            if (fb.sentiment === 'critical') { sentBadge = '🚨 Critical'; sentClass = 'color: #ef4444; font-weight: 700;'; }
            if (fb.sentiment === 'negative') { sentBadge = '⚠️ Negative'; sentClass = 'color: #f59e0b;'; }
            if (fb.sentiment === 'positive') { sentBadge = '⭐ Positive'; sentClass = 'color: #10b981; font-weight: 600;'; }

            const entityParts = [];
            if (fb.jobTitle) entityParts.push('💼 <strong>' + escapeHtml(fb.jobTitle) + '</strong>');
            else if (fb.jobId) entityParts.push('💼 <code>' + escapeHtml(fb.jobId) + '</code>');
            if (fb.companyName) entityParts.push('🏢 ' + escapeHtml(fb.companyName));
            else if (fb.companyId) entityParts.push('🏢 <code>' + escapeHtml(fb.companyId) + '</code>');
            const entityHtml = entityParts.length > 0 ? entityParts.join('<br>') : '<span style="color: var(--text-muted);">Platform / General</span>';

            let statusBadge = '<span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">🆕 New</span>';
            if (fb.status === 'reviewed') statusBadge = '<span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">👀 Reviewed</span>';
            if (fb.status === 'actioned') statusBadge = '<span style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">✅ Actioned</span>';
            if (fb.status === 'dismissed') statusBadge = '<span style="background: rgba(100, 116, 139, 0.2); color: #94a3b8; padding: 2px 8px; border-radius: 4px; font-size: 11px;">🗑️ Dismissed</span>';

            const actions = [];
            if (fb.status === 'new') {
              actions.push('<button class="btn btn-secondary btn-sm" style="font-size: 11px; padding: 2px 8px;" onclick="updateFeedbackStatus(&quot;' + fb.id + '&quot;, &quot;reviewed&quot;)">Mark Reviewed</button>');
            }
            if (fb.status !== 'actioned') {
              actions.push('<button class="btn btn-primary btn-sm" style="font-size: 11px; padding: 2px 8px;" onclick="updateFeedbackStatus(&quot;' + fb.id + '&quot;, &quot;actioned&quot;)">Mark Actioned</button>');
            }
            if (fb.status !== 'dismissed') {
              actions.push('<button class="btn btn-secondary btn-sm" style="font-size: 11px; padding: 2px 8px;" onclick="updateFeedbackStatus(&quot;' + fb.id + '&quot;, &quot;dismissed&quot;)">Dismiss</button>');
            }
            actions.push('<button class="btn btn-secondary btn-sm" style="font-size: 11px; padding: 2px 8px; color: #ef4444;" onclick="deleteFeedback(&quot;' + fb.id + '&quot;)">Delete</button>');

            return '<tr>' +
              '<td>' +
                '<div style="font-weight: 600; color: #fff;">' + userHandle + '</div>' +
                '<div style="font-size: 11px; color: var(--text-muted);">' + timeStr + '</div>' +
              '</td>' +
              '<td>' +
                '<span style="background: ' + typeBadgeColor + '; color: ' + typeTextColor + '; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; display: inline-block; margin-bottom: 4px;">' + escapeHtml(fb.feedbackType) + '</span>' +
                '<div style="' + sentClass + '; font-size: 11px;">' + sentBadge + '</div>' +
              '</td>' +
              '<td style="max-width: 320px;">' +
                '<div style="font-size: 13px; color: #f1f5f9; margin-bottom: 4px; line-height: 1.4;">' + escapeHtml(fb.comment) + '</div>' +
                (fb.contextSummary ? '<div style="font-size: 11px; color: var(--text-muted); font-style: italic;">Context: ' + escapeHtml(fb.contextSummary) + '</div>' : '') +
              '</td>' +
              '<td style="font-size: 12px;">' + entityHtml + '</td>' +
              '<td style="max-width: 220px; font-size: 12px; color: #38bdf8;">' +
                (fb.suggestedAction ? '🎯 <em>' + escapeHtml(fb.suggestedAction) + '</em>' : '<span style="color: var(--text-muted);">—</span>') +
              '</td>' +
              '<td>' +
                '<div style="margin-bottom: 6px;">' + statusBadge + '</div>' +
                '<div style="display: flex; flex-wrap: wrap; gap: 4px;">' + actions.join('') + '</div>' +
              '</td>' +
            '</tr>';
          }).join('');
        }
      } catch (err) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger); padding: 30px;">Error fetching feedbacks.</td></tr>';
      }
    }

    function prevFeedbackPage() {
      if (currentFeedbackPage > 1) loadFeedbacks(currentFeedbackPage - 1);
    }

    function nextFeedbackPage() {
      if (currentFeedbackPage < totalFeedbackPages) loadFeedbacks(currentFeedbackPage + 1);
    }

    function resetFeedbackFilters() {
      const s = document.getElementById('fb-filter-search'); if (s) s.value = '';
      const t = document.getElementById('fb-filter-type'); if (t) t.value = 'all';
      const m = document.getElementById('fb-filter-sentiment'); if (m) m.value = 'all';
      const st = document.getElementById('fb-filter-status'); if (st) st.value = 'all';
      loadFeedbacks(1);
    }

    async function updateFeedbackStatus(id, newStatus) {
      try {
        const res = await apiFetch('/api/admin/feedbacks/status', {
          method: 'POST',
          body: { id, status: newStatus }
        });
        if (res.ok) {
          showToast('Feedback status updated to ' + newStatus);
          loadFeedbacks(currentFeedbackPage);
          loadStats();
        } else {
          showToast('Failed to update status');
        }
      } catch (err) {
        showToast('Network error updating status');
      }
    }

    async function deleteFeedback(id) {
      if (!confirm('Are you sure you want to permanently delete this feedback record?')) return;
      try {
        const res = await apiFetch('/api/admin/feedbacks/delete', {
          method: 'POST',
          body: { id }
        });
        if (res.ok) {
          showToast('Feedback deleted');
          loadFeedbacks(currentFeedbackPage);
          loadStats();
        } else {
          showToast('Failed to delete feedback');
        }
      } catch (err) {
        showToast('Network error deleting feedback');
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Auto-polling every 5 seconds for live status
    setInterval(() => {
      loadStats();
      const activeTab = document.querySelector('.tab-btn.active')?.getAttribute('onclick') || '';
      if (activeTab.includes('tasks')) loadTasks();
    }, 5000);

    // Initial load
    loadStats();
    loadTasks();
  </script>
</body>
</html>`;
}

/** Minimal login page. No token is ever embedded; the form POSTs to /admin/login. */
export function renderAdminLoginHtml(error?: string): string {
  const err = error ? `<p style="color:#f87171;margin:0 0 12px">${error.replace(/[<>&"]/g, "")}</p>` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Admin sign in · Off-Radar Jobs</title>
</head>
<body style="font-family:system-ui,sans-serif;background:#0b1120;color:#e2e8f0;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">
  <form method="POST" action="/admin/login" style="background:#131b2e;padding:28px;border-radius:12px;border:1px solid #1f2a44;min-width:300px">
    <h1 style="font-size:18px;margin:0 0 16px">Admin sign in</h1>
    ${err}
    <label for="token" style="display:block;font-size:13px;margin-bottom:6px">Admin token</label>
    <input id="token" name="token" type="password" autocomplete="current-password" required style="width:100%;padding:8px;border-radius:6px;border:1px solid #334155;background:#0f172a;color:#e2e8f0;box-sizing:border-box" />
    <button type="submit" style="margin-top:14px;width:100%;padding:9px;border-radius:6px;border:0;background:#38bdf8;color:#0b1120;font-weight:600">Sign in</button>
  </form>
</body>
</html>`;
}
