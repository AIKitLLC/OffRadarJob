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
    .tag-midwest { background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); }
    .tag-remote { background: rgba(16, 185, 129, 0.1); color: var(--success); }
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
    .log-msg { color: #cbd5e1; flex: 1; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <h1><span>🎯</span> OffRadarJob Gatherer</h1>
        <p>Decoupled Cloudflare Agent Pipeline for Micro-Companies & Unlisted Jobs</p>
      </div>
      <div class="status-badge">
        <span class="status-dot"></span>
        Cloudflare Edge Active
      </div>
    </header>

    <div class="midwest-banner">
      <div class="midwest-banner-text">
        <strong>📍 Active Focus: US-Midwest Region</strong> — Targeting boutique software studios, micro-SaaS, and indie tech teams in Chicago (IL), Indianapolis (IN), Minneapolis (MN), Madison (WI), Cincinnati (OH), and Ann Arbor (MI).
      </div>
      <span class="midwest-tag">Midwest Active</span>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Micro-Companies</span>
        <span class="stat-value" id="stat-companies">0</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Off-Radar Jobs</span>
        <span class="stat-value" id="stat-jobs">0</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Midwest Focus</span>
        <span class="stat-value" id="stat-midwest" style="color: #fb7185;">100%</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Telemetry Events</span>
        <span class="stat-value" id="stat-logs">0</span>
      </div>
    </div>

    <div class="crawl-trigger">
      <h2>🚀 Ingest & Dispatch New Seed Domain</h2>
      <div class="input-group">
        <input type="text" id="seed-input" placeholder="e.g. https://sixfeetup.com, https://bendyworks.com, https://promptloop.com" />
        <button id="btn-crawl" onclick="triggerCrawl()">Dispatch to Discovery Queue</button>
      </div>
      <div class="quick-seeds">
        <span>Quick Midwest Seeds:</span>
        <span class="quick-seed-chip" onclick="fillSeed('https://promptloop.com')">PromptLoop (Chicago, IL)</span>
        <span class="quick-seed-chip" onclick="fillSeed('https://sixfeetup.com')">Six Feet Up (Carmel, IN)</span>
        <span class="quick-seed-chip" onclick="fillSeed('https://bendyworks.com')">Bendyworks (Madison, WI)</span>
        <span class="quick-seed-chip" onclick="fillSeed('https://softwareforgood.com')">Software for Good (Minneapolis, MN)</span>
        <span class="quick-seed-chip" onclick="fillSeed('https://gaslight.co')">Gaslight (Cincinnati, OH)</span>
      </div>
    </div>

    <div class="filter-bar">
      <div class="nav-tabs">
        <button class="tab-btn active" onclick="switchTab('jobs')">Gathered Jobs</button>
        <button class="tab-btn" onclick="switchTab('companies')">Micro-Companies Directory</button>
        <button class="tab-btn" onclick="switchTab('telemetry')">Agent Telemetry & Logs</button>
      </div>
      <div>
        <select id="region-filter" class="region-select" onchange="filterRegion()">
          <option value="all">Filter: All Regions</option>
          <option value="midwest" selected>Filter: 📍 US-Midwest Focus</option>
          <option value="remote">Filter: 🌐 Worldwide Remote</option>
        </select>
      </div>
    </div>

    <div id="tab-jobs" class="tab-content active">
      <div id="jobs-container" class="job-list">
        <p style="color: var(--text-muted)">Loading gathered jobs...</p>
      </div>
    </div>

    <div id="tab-companies" class="tab-content">
      <div id="companies-container" class="companies-grid">
        <p style="color: var(--text-muted)">Loading companies directory...</p>
      </div>
    </div>

    <div id="tab-telemetry" class="tab-content">
      <div class="log-terminal" id="logs-container">
        <p style="color: var(--text-muted)">Loading telemetry stream...</p>
      </div>
    </div>
  </div>

  <script>
    let allJobs = [];
    let allCompanies = [];

    async function loadData() {
      try {
        const [jobsRes, compsRes, statsRes] = await Promise.all([
          fetch('/api/jobs').then(r => r.json()),
          fetch('/api/companies').then(r => r.json()),
          fetch('/api/stats').then(r => r.json())
        ]);

        allJobs = Array.isArray(jobsRes) ? jobsRes : [];
        allCompanies = Array.isArray(compsRes) ? compsRes : [];

        document.getElementById('stat-companies').innerText = allCompanies.length || 0;
        document.getElementById('stat-jobs').innerText = allJobs.length || 0;
        document.getElementById('stat-logs').innerText = statsRes.logsCount || 0;

        const midwestCount = allJobs.filter(j => 
          (j.remoteScope && j.remoteScope.includes('midwest')) || 
          (j.location && (j.location.includes('Midwest') || j.location.includes('IN') || j.location.includes('IL') || j.location.includes('WI') || j.location.includes('MN') || j.location.includes('OH')))
        ).length;
        
        const pct = allJobs.length > 0 ? Math.round((midwestCount / allJobs.length) * 100) : 100;
        document.getElementById('stat-midwest').innerText = pct + '%';

        renderJobs();
        renderCompanies();
        renderLogs(statsRes.recentLogs || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    }

    function filterRegion() {
      renderJobs();
      renderCompanies();
    }

    function renderJobs() {
      const container = document.getElementById('jobs-container');
      const region = document.getElementById('region-filter').value;
      
      let filtered = allJobs;
      if (region === 'midwest') {
        filtered = allJobs.filter(j => 
          (j.remoteScope && j.remoteScope.includes('midwest')) || 
          (j.location && (j.location.includes('Midwest') || j.location.includes('IN') || j.location.includes('IL') || j.location.includes('WI') || j.location.includes('MN') || j.location.includes('OH')))
        );
      } else if (region === 'remote') {
        filtered = allJobs.filter(j => j.isRemote);
      }

      if (filtered.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); padding: 24px; text-align: center;">No off-radar jobs found for selected filter. Trigger a seed crawl above!</p>';
        return;
      }

      container.innerHTML = filtered.map(j => {
        const isMidwest = (j.remoteScope && j.remoteScope.includes('midwest')) || (j.location && j.location.includes('Midwest'));
        return \`
          <div class="job-card">
            <div class="job-main">
              <h3>\${j.title}</h3>
              <a class="job-company" href="/api/companies" target="_blank">🏢 Company: \${j.companyId.replace('comp_', '').replace(/_/g, '.')}</a>
              <p class="job-desc">\${j.descriptionSummary || 'Direct opening from micro-company career portal.'}</p>
              <div class="job-tags">
                \${isMidwest ? '<span class="tag tag-midwest">📍 US-Midwest</span>' : ''}
                <span class="tag tag-remote">🌐 \${j.isRemote ? 'Remote (' + j.remoteScope + ')' : j.location}</span>
                <span class="tag">\${j.employmentType}</span>
                \${j.salaryMin ? \`<span class="tag tag-salary">\$\${j.salaryMin.toLocaleString()} - \$\${j.salaryMax.toLocaleString()} \${j.salaryCurrency || 'USD'}</span>\` : ''}
                \${(j.skills || []).map(s => \`<span class="tag">\${s}</span>\`).join('')}
              </div>
            </div>
            <div>
              <a class="apply-btn" href="\${j.applyType === 'email' ? 'mailto:' + j.applyTarget : j.applyTarget}" target="_blank">
                Apply via \${j.applyType.toUpperCase()} ↗
              </a>
            </div>
          </div>
        \`;
      }).join('');
    }

    function renderCompanies() {
      const container = document.getElementById('companies-container');
      const region = document.getElementById('region-filter').value;
      
      let filtered = allCompanies;
      if (region === 'midwest') {
        filtered = allCompanies.filter(c => c.locationHint && c.locationHint.includes('Midwest'));
      }

      if (filtered.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">No companies found matching filter.</p>';
        return;
      }

      container.innerHTML = filtered.map(c => \`
        <div class="company-card">
          <div class="company-header">
            <a class="company-name" href="\${c.websiteUrl}" target="_blank">\${c.name} ↗</a>
            <span class="company-badge">\${c.headcountEstimate || '1-20'} team</span>
          </div>
          <p class="company-desc">\${c.description || c.tagline || 'Independent tech company.'}</p>
          <div class="job-tags">
            \${c.locationHint && c.locationHint.includes('Midwest') ? '<span class="tag tag-midwest">📍 ' + c.locationHint + '</span>' : ''}
            \${(c.techStack || []).slice(0, 5).map(s => \`<span class="tag">\${s}</span>\`).join('')}
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: auto;">
            \${c.contactEmail ? '📧 ' + c.contactEmail : ''} \${c.locationHint ? '• 🌐 ' + c.locationHint : ''}
          </div>
        </div>
      \`).join('');
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
      event.target.classList.add('active');
      document.getElementById('tab-' + tab).classList.add('active');
    }

    loadData();
    setInterval(loadData, 5000);
  </script>
</body>
</html>`;
}
