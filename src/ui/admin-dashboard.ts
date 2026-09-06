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
    </div>

    <!-- TAB 1: Crawl Tasks Monitor -->
    <div id="tab-tasks" class="tab-content">
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
          Tự động khai thác dữ liệu các công ty siêu nhỏ, boutique tech studios & indie makers từ các nguồn mở (Hacker News 'Who is Hiring' Algolia API & GitHub Open Repositories 880+ công ty), sau đó dùng chính website chính thức để Agent quét và bóc tách việc làm trực tiếp.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 8px;">
          <!-- HN Harvester -->
          <div style="background: rgba(13, 20, 36, 0.6); padding: 16px; border-radius: 10px; border: 1px solid var(--card-border);">
            <div style="font-size: 14px; font-weight: 700; color: #f97316; margin-bottom: 6px;">
              🟠 Hacker News "Who is Hiring?"
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
              Bóc tách thread tuyển dụng mới nhất trên Hacker News. Trích xuất tên công ty, website, tech stack, email liên hệ và link ứng tuyển trực tiếp.
            </p>
            <div class="form-row" style="margin-bottom: 0;">
              <input type="number" id="hn-harvest-limit" class="form-input" value="20" min="5" max="50" style="max-width: 80px;" title="Số lượng công ty">
              <button class="btn btn-sm" style="background: #f97316; color: #fff;" onclick="triggerHarvest('hn')">⚡ Harvest Hacker News</button>
            </div>
          </div>

          <!-- GitHub Harvester -->
          <div style="background: rgba(13, 20, 36, 0.6); padding: 16px; border-radius: 10px; border: 1px solid var(--card-border);">
            <div style="font-size: 14px; font-weight: 700; color: #38bdf8; margin-bottom: 6px;">
              🐙 GitHub Open Directories
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
              Đọc danh bạ 880+ công ty remote & boutique studios (remoteintech & established-remote). Nạp thông tin và kích hoạt Agent vào website quét việc làm.
            </p>
            <div class="form-row" style="margin-bottom: 0;">
              <input type="number" id="gh-harvest-limit" class="form-input" value="25" min="5" max="50" style="max-width: 80px;" title="Số lượng công ty">
              <button class="btn btn-sm" style="background: #0284c7; color: #fff;" onclick="triggerHarvest('github')">🐙 Harvest GitHub Repos</button>
            </div>
          </div>

          <!-- Full Harvest -->
          <div style="background: rgba(13, 20, 36, 0.6); padding: 16px; border-radius: 10px; border: 1px solid var(--card-border);">
            <div style="font-size: 14px; font-weight: 700; color: #a855f7; margin-bottom: 6px;">
              🚀 Multi-Source & Direct Crawl
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
              Kết hợp đồng thời cả Hacker News & GitHub. Nạp đồng loạt công ty vào database và điều phối Agent cào website song song.
            </p>
            <div class="form-row" style="margin-bottom: 0;">
              <input type="number" id="all-harvest-limit" class="form-input" value="30" min="10" max="60" style="max-width: 80px;" title="Tổng số công ty">
              <button class="btn btn-sm" style="background: #a855f7; color: #fff;" onclick="triggerHarvest('all')">🚀 Harvest All Sources</button>
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
              <div class="preset-desc">Kích hoạt quét đồng loạt toàn bộ 90+ công ty vừa và nhỏ trên khắp nước Mỹ vào Cloudflare Queues / Background Runner.</div>
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
          Lần đầu tiên nạp dữ liệu, bạn có thể kích hoạt <strong>Initial Bulk Blast</strong> để quét đồng loạt toàn bộ các công ty vừa và nhỏ trên khắp nước Mỹ. Sau đó, hệ thống sẽ tự động quét định kỳ <strong>1 tuần 1 lần</strong> (mỗi Thứ Hai lúc 03:00 UTC) để cập nhật công việc mới mà không cần thao tác lại.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
          <!-- Card 1: Initial Simultaneous Bulk Sweep -->
          <div style="background: rgba(13, 20, 36, 0.6); padding: 16px; border-radius: 10px; border: 1px solid var(--card-border);">
            <div style="font-size: 14px; font-weight: 700; color: #38bdf8; margin-bottom: 6px;">
              🚀 Lần đầu: Initial Simultaneous Bulk Blast
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
              Quét đồng loạt toàn bộ tất cả công ty đang có trong database. Tự động chia nhỏ thành các batch song song trên Cloudflare Queues để cào nhanh nhất có thể.
            </p>
            <button class="btn btn-sm" style="background: #0284c7; color: #fff;" onclick="triggerBulkSweepAll()">🚀 Run Initial Bulk Blast (All Companies)</button>
          </div>

          <!-- Card 2: Serverless Cloudflare Queues Feed -->
          <div style="background: rgba(13, 20, 36, 0.6); padding: 16px; border-radius: 10px; border: 1px solid var(--card-border);">
            <div style="font-size: 14px; font-weight: 700; color: #a855f7; margin-bottom: 6px;">
              ☁️ Queue 90+ US Curated Targets
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
              Đẩy toàn bộ 90+ công ty vừa và nhỏ đã kiểm duyệt (Midwest, Texas, East Coast, West Coast) vào hàng đợi để các Agent cào ngầm liên tục.
            </p>
            <button class="btn btn-sm" style="background: #8b5cf6; color: #fff;" onclick="triggerBulkSeed()">🚀 Queue 90+ US Targets</button>
          </div>

          <!-- Card 3: Autonomous CLI Feeder -->
          <div style="background: rgba(13, 20, 36, 0.6); padding: 16px; border-radius: 10px; border: 1px solid var(--card-border);">
            <div style="font-size: 14px; font-weight: 700; color: #10b981; margin-bottom: 6px;">
              💻 Chạy nền Terminal / VPS dài tiếng
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
              Chạy trực tiếp từ terminal hoặc VPS với pacing lịch sự (rate-limit protection):
            </p>
            <div class="code-text" style="padding: 6px 10px; display: block; overflow-x: auto; color: #34d399;">
              npm run feed:continuous -- --duration=3 --interval=15
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">
              Quét liên tục trong 3 giờ với giãn cách 15s giữa mỗi wave.
            </div>
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
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px;">
        <!-- Bot Status Card -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">🤖 Telegram Bot Status & Webhook</div>
            <button class="btn btn-primary btn-sm" onclick="setupTgWebhook()">🔗 Setup Webhook</button>
          </div>
          <div style="padding: 20px;">
            <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: #0088cc22; border: 1px solid #0088cc; display: flex; align-items: center; justify-content: center; font-size: 24px;">✈️</div>
              <div>
                <div style="font-size: 16px; font-weight: 700; color: #fff;" id="tg-bot-handle">@OffRadarJobBot</div>
                <div style="font-size: 13px; color: #38bdf8;" id="tg-webhook-status">Checking webhook status...</div>
              </div>
            </div>
            <div style="background: var(--bg-card-alt); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px; font-size: 13px; line-height: 1.6;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: var(--text-muted);">Configured Admin Handles:</span>
                <strong style="color: #f59e0b;" id="tg-configured-admins">@tuannx87</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: var(--text-muted);">Configured Admin IDs:</span>
                <strong style="color: #a78bfa;" id="tg-configured-ids">None (Any ID with username or token)</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--text-muted);">Target Alert Chat ID:</span>
                <strong style="color: #10b981;" id="tg-alert-chat">Configured via TELEGRAM_ADMIN_CHAT_ID</strong>
              </div>
            </div>
          </div>
        </div>

        <!-- Telegram Admin Test & Quick Actions -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">🔔 Admin Notification & Test Alert</div>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 14px;">
              Gửi tin nhắn test tới Admin Telegram Chat để đảm bảo hệ thống cảnh báo sự cố, phát hiện job mới và crawler status hoạt động thông suốt.
            </p>
            <div style="display: flex; gap: 10px; margin-bottom: 16px;">
              <input type="text" id="input-test-alert-msg" class="form-input" placeholder="Nhập nội dung thông báo kiểm tra..." value="🚀 [OffRadarJob Alert] Hệ thống crawler & bot hoạt động bình thường." style="flex: 1;" />
              <button class="btn btn-primary" onclick="sendTestAlert()">📢 Gửi Test</button>
            </div>
            <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 8px; padding: 12px; font-size: 12px; color: #bae6fd;">
              💡 <strong>Mẹo:</strong> Trong Telegram chat với bot, bạn có thể gõ <code>/admin auth &lt;token&gt;</code> để tự nâng cấp quyền Admin bất cứ lúc nào!
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
            <div style="font-size: 12px; color: var(--text-muted);">Xem báo cáo realtime số lượng jobs, companies, tỷ lệ Midwest và crawl tasks gần nhất.</div>
          </div>
          <div style="background: var(--bg-card-alt); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: #10b981; font-size: 14px; margin-bottom: 6px;">🕷️ /crawl &lt;url&gt;</div>
            <div style="font-size: 12px; color: var(--text-muted);">Kích hoạt crawl ngay 1 career page URL (tự động phân tích, profile & trích xuất jobs).</div>
          </div>
          <div style="background: var(--bg-card-alt); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: #f59e0b; font-size: 14px; margin-bottom: 6px;">⚡ /sweep</div>
            <div style="font-size: 12px; color: var(--text-muted);">Kích hoạt quét đồng loạt top seed companies trong background queue.</div>
          </div>
          <div style="background: var(--bg-card-alt); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: #a78bfa; font-size: 14px; margin-bottom: 6px;">🌾 /harvest [hn|github|all]</div>
            <div style="font-size: 12px; color: var(--text-muted);">Thu thập danh sách công ty & jobs từ Hacker News hoặc GitHub repositories.</div>
          </div>
          <div style="background: var(--bg-card-alt); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: #ec4899; font-size: 14px; margin-bottom: 6px;">👥 /users</div>
            <div style="font-size: 12px; color: var(--text-muted);">Thống kê tổng số người dùng, số lượng Admins và 5 người dùng mới nhất.</div>
          </div>
          <div style="background: var(--bg-card-alt); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
            <div style="font-weight: 700; color: #3b82f6; font-size: 14px; margin-bottom: 6px;">🔗 /adminlink</div>
            <div style="font-size: 12px; color: var(--text-muted);">Tạo magic URL đăng nhập 1 chạm vào Web Admin Control Center.</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="toast" class="toast"></div>

  <script>
    const token = new URLSearchParams(window.location.search).get('token') || 'offradar-admin-2026';

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
    }

    async function apiFetch(endpoint, options = {}) {
      options.headers = options.headers || {};
      options.headers['x-admin-token'] = token;
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
        loadTelegramData()
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

        document.getElementById('tab-tasks-count').textContent = data.tasks?.total ?? 0;
        document.getElementById('tab-jobs-count').textContent = data.jobsCount ?? 0;
        document.getElementById('tab-logs-count').textContent = data.logsCount ?? 0;
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
      if (!confirm("Kích hoạt Initial Bulk Blast quét đồng loạt TOÀN BỘ tất cả các công ty đang có trong database?")) return;
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

    async function triggerHarvest(source) {
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

    // --- TELEGRAM BOT & ADMIN MANAGEMENT ---
    async function loadTelegramData() {
      try {
        const res = await apiFetch('/api/admin/telegram/status');
        if (res.ok) {
          const data = await res.json();
          document.getElementById('tg-bot-handle').textContent = '@' + data.botUsername;
          document.getElementById('tg-configured-admins').textContent = data.configuredAdmins.map(a => '@' + a).join(', ') || 'None';
          document.getElementById('tg-configured-ids').textContent = data.configuredAdminIds.join(', ') || 'None (Any ID with username or token)';
          document.getElementById('tg-alert-chat').textContent = data.adminChatId || 'Not configured in env';
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
          
          var actionBtn = isAdmin
            ? '<button class="btn btn-secondary btn-sm" onclick="toggleUserRole(\'' + escapeHtml(u.id) + '\', \'user\')">Revoke Admin</button>'
            : '<button class="btn btn-primary btn-sm" onclick="toggleUserRole(\'' + escapeHtml(u.id) + '\', \'admin\')">Grant Admin 👑</button>';

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
        const res = await fetch('/api/telegram/setup-webhook');
        const data = await res.json();
        if (res.ok && data.result?.ok) {
          showToast("✅ Telegram Webhook registered successfully!");
          loadTelegramData();
        } else {
          showToast("Webhook setup: " + (data.error || data.result?.description || "Failed"));
        }
      } catch (err) {
        showToast("Error connecting to webhook setup endpoint.");
      }
    }

    async function sendTestAlert() {
      const msgInput = document.getElementById('input-test-alert-msg');
      const message = msgInput?.value.trim();
      if (!message) return;

      try {
        showToast("Sending test notification...");
        const res = await apiFetch('/api/admin/telegram/test-notify', {
          method: 'POST',
          body: { message }
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
