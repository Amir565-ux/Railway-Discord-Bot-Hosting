import express from 'express';

const app = express();

// ============================================
// HEALTH CHECK (required by Railway)
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    uptime: process.uptime(),
    memory: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)
  });
});

// ============================================
// MAIN DASHBOARD UI
// ============================================
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bot Panel — Made by CodingBoyz</title>
<style>
  :root {
    --bg-primary: #0a0a0a;
    --bg-secondary: #111111;
    --bg-tertiary: #1a1a1a;
    --border: #2a2a2a;
    --text-primary: #ffffff;
    --text-secondary: #a0a0a0;
    --text-muted: #555555;
    --accent: #ffffff;
    --success: #22c55e;
    --danger: #ef4444;
    --warning: #f59e0b;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    display: flex;
    overflow: hidden;
  }

  /* ============================================
     SIDEBAR
     ============================================ */
  .sidebar {
    width: 260px;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border);
    padding: 24px 0;
    display: flex;
    flex-direction: column;
    height: 100vh;
    flex-shrink: 0;
  }

  .sidebar-header {
    padding: 0 24px 24px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 16px;
  }

  .sidebar-header h1 {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-primary);
  }

  .sidebar-header span {
    font-size: 11px;
    color: var(--text-muted);
    display: block;
    margin-top: 6px;
    font-weight: 500;
    letter-spacing: 0.5px;
  }

  .nav-item {
    padding: 12px 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 14px;
    border-left: 3px solid transparent;
    transition: all 0.2s ease;
    cursor: pointer;
    font-weight: 500;
  }

  .nav-item:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .nav-item.active {
    border-left-color: var(--accent);
    background: var(--bg-tertiary);
    color: var(--text-primary);
    font-weight: 600;
  }

  .nav-icon {
    width: 18px;
    height: 18px;
    opacity: 0.8;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  /* ============================================
     MAIN CONTENT
     ============================================ */
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  .topbar {
    height: 64px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    flex-shrink: 0;
  }

  .topbar-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .topbar-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--text-secondary);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--success);
    box-shadow: 0 0 8px var(--success);
  }

  .content {
    flex: 1;
    padding: 32px;
    overflow-y: auto;
  }

  .tab-content {
    display: none;
    animation: fadeIn 0.3s ease;
  }

  .tab-content.active {
    display: block;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(5px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .page-title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .page-subtitle {
    color: var(--text-muted);
    font-size: 14px;
    margin-bottom: 32px;
  }

  /* ============================================
     STATUS CARDS
     ============================================ */
  .status-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }

  .status-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 20px;
    transition: border-color 0.2s;
  }

  .status-card:hover {
    border-color: var(--text-muted);
  }

  .status-card .label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text-muted);
    margin-bottom: 10px;
    font-weight: 600;
  }

  .status-card .value {
    font-size: 24px;
    font-weight: 700;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }

  .status-card .value.online { color: var(--success); }
  .status-card .value.offline { color: var(--danger); }
  .status-card .value.warning { color: var(--warning); }

  /* ============================================
     POWER CONTROLS
     ============================================ */
  .power-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-bottom: 32px;
  }

  .power-btn {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 20px;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s ease;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    position: relative;
    overflow: hidden;
  }

  .power-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: transparent;
    transition: background 0.2s;
  }

  .power-btn.start::before { background: var(--success); }
  .power-btn.restart::before { background: var(--warning); }
  .power-btn.stop::before { background: var(--danger); }
  .power-btn.kill::before { background: #ff0000; }

  .power-btn:hover {
    background: var(--bg-tertiary);
    border-color: var(--text-muted);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }

  .power-btn:active {
    transform: translateY(0);
  }

  .power-btn .icon {
    font-size: 28px;
    line-height: 1;
  }

  .power-btn .btn-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text-secondary);
  }

  .power-btn.hidden {
    display: none;
  }

  /* ============================================
     CONSOLE
     ============================================ */
  .console-box {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 32px;
  }

  .console-header {
    padding: 14px 20px;
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .console-header h3 {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: var(--text-secondary);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .console-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--success);
    display: inline-block;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .console-output {
    padding: 20px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 13px;
    line-height: 1.8;
    max-height: 450px;
    overflow-y: auto;
    color: var(--text-secondary);
    background: #0d0d0d;
  }

  .console-output .line {
    margin-bottom: 2px;
    display: flex;
    gap: 12px;
  }

  .console-output .line .timestamp {
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .console-output .line .info { color: var(--text-primary); }
  .console-output .line .warn { color: var(--warning); }
  .console-output .line .error { color: var(--danger); }
  .console-output .line .success { color: var(--success); }

  /* ============================================
     SCROLLBAR
     ============================================ */
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: var(--bg-primary); }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

  /* ============================================
     RESPONSIVE
     ============================================ */
  @media (max-width: 768px) {
    .sidebar { width: 60px; }
    .sidebar-header h1, .sidebar-header span, .nav-item span:not(.nav-icon) { display: none; }
    .nav-item { justify-content: center; padding: 12px; }
    .content { padding: 20px; }
  }
</style>
</head>
<body>

<!-- SIDEBAR -->
<aside class="sidebar">
  <div class="sidebar-header">
    <h1>Bot Panel</h1>
    <span>Made by CodingBoyz</span>
  </div>
  
  <a class="nav-item active" id="nav-dashboard" onclick="switchTab('dashboard', this)">
    <span class="nav-icon">◉</span> Dashboard
  </a>
  <a class="nav-item" id="nav-console" onclick="switchTab('console', this)">
    <span class="nav-icon">▤</span> Console
  </a>
  <a class="nav-item" id="nav-files" onclick="switchTab('files', this)">
    <span class="nav-icon">▦</span> Files
  </a>
  <a class="nav-item" id="nav-databases" onclick="switchTab('databases', this)">
    <span class="nav-icon">◈</span> Databases
  </a>
  <a class="nav-item" id="nav-settings" onclick="switchTab('settings', this)">
    <span class="nav-icon">⚙</span> Settings
  </a>
  <a class="nav-item" id="nav-network" onclick="switchTab('network', this)">
    <span class="nav-icon">⇄</span> Network
  </a>
  <a class="nav-item" id="nav-schedules" onclick="switchTab('schedules', this)">
    <span class="nav-icon">◷</span> Schedules
  </a>
  <a class="nav-item" id="nav-users" onclick="switchTab('users', this)">
    <span class="nav-icon">◈</span> Users
  </a>
</aside>

<!-- MAIN CONTENT -->
<div class="main">
  <div class="topbar">
    <div class="topbar-title" id="topbar-title">Dashboard</div>
    <div class="topbar-status">
      <span class="status-dot"></span>
      <span id="topbar-status-text">Running</span>
    </div>
  </div>

  <div class="content">
    
    <!-- DASHBOARD TAB -->
    <div class="tab-content active" id="tab-dashboard">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Monitor and control your Discord bot</p>

      <!-- STATUS CARDS -->
      <div class="status-grid">
        <div class="status-card">
          <div class="label">Status</div>
          <div class="value online" id="status">ONLINE</div>
        </div>
        <div class="status-card">
          <div class="label">Uptime</div>
          <div class="value" id="uptime">0h 0m</div>
        </div>
        <div class="status-card">
          <div class="label">Ping</div>
          <div class="value" id="ping">—</div>
        </div>
        <div class="status-card">
          <div class="label">Memory</div>
          <div class="value" id="memory">0 MB</div>
        </div>
      </div>

      <!-- POWER CONTROLS -->
      <div class="power-grid">
        <button class="power-btn start hidden" id="btn-start" onclick="powerAction('start')">
          <span class="icon">▶</span>
          <span class="btn-label">Start</span>
        </button>
        <button class="power-btn restart" id="btn-restart" onclick="powerAction('restart')">
          <span class="icon">↻</span>
          <span class="btn-label">Restart</span>
        </button>
        <button class="power-btn stop" id="btn-stop" onclick="powerAction('stop')">
          <span class="icon">■</span>
          <span class="btn-label">Stop</span>
        </button>
        <button class="power-btn kill" id="btn-kill" onclick="powerAction('kill')">
          <span class="icon">✕</span>
          <span class="btn-label">Kill</span>
        </button>
      </div>

      <!-- LIVE CONSOLE -->
      <div class="console-box">
        <div class="console-header">
          <h3><span class="console-dot"></span> Live Console</h3>
          <span style="font-size:12px;color:var(--text-muted);">Auto-refreshing</span>
        </div>
        <div class="console-output" id="console">
          <div class="line"><span class="timestamp">[00:00:00]</span><span class="success">Bot initialized. Waiting for events...</span></div>
        </div>
      </div>
    </div>

    <!-- CONSOLE TAB -->
    <div class="tab-content" id="tab-console">
      <h1 class="page-title">Console</h1>
      <p class="page-subtitle">Full server log output</p>
      <div class="console-box">
        <div class="console-output" id="console-full" style="max-height: calc(100vh - 220px);">
          <div class="line"><span class="timestamp">[00:00:00]</span><span class="info">Full console output will appear here.</span></div>
        </div>
      </div>
    </div>

    <!-- FILES TAB -->
    <div class="tab-content" id="tab-files">
      <h1 class="page-title">Files</h1>
      <p class="page-subtitle">Manage your server files</p>
      <div class="status-card" style="padding: 40px; text-align: center; color: var(--text-muted);">
        <p>File manager interface would go here.</p>
        <p style="font-size: 12px; margin-top: 10px;">Connect to the Pterodactyl API to enable this feature.</p>
      </div>
    </div>

    <!-- DATABASES TAB -->
    <div class="tab-content" id="tab-databases">
      <h1 class="page-title">Databases</h1>
      <p class="page-subtitle">Manage your database instances</p>
      <div class="status-card" style="padding: 40px; text-align: center; color: var(--text-muted);">
        <p>Database management would go here.</p>
      </div>
    </div>

    <!-- SETTINGS TAB -->
    <div class="tab-content" id="tab-settings">
      <h1 class="page-title">Settings</h1>
      <p class="page-subtitle">Configure your server</p>
      <div class="status-card" style="padding: 40px; text-align: center; color: var(--text-muted);">
        <p>Server settings would go here.</p>
      </div>
    </div>

    <!-- NETWORK TAB -->
    <div class="tab-content" id="tab-network">
      <h1 class="page-title">Network</h1>
      <p class="page-subtitle">Manage allocations and ports</p>
      <div class="status-card" style="padding: 40px; text-align: center; color: var(--text-muted);">
        <p>Network configuration would go here.</p>
      </div>
    </div>

    <!-- SCHEDULES TAB -->
    <div class="tab-content" id="tab-schedules">
      <h1 class="page-title">Schedules</h1>
      <p class="page-subtitle">Automate tasks</p>
      <div class="status-card" style="padding: 40px; text-align: center; color: var(--text-muted);">
        <p>Schedule management would go here.</p>
      </div>
    </div>

    <!-- USERS TAB -->
    <div class="tab-content" id="tab-users">
      <h1 class="page-title">Users</h1>
      <p class="page-subtitle">Manage subusers and permissions</p>
      <div class="status-card" style="padding: 40px; text-align: center; color: var(--text-muted);">
        <p>User management would go here.</p>
      </div>
    </div>

  </div>
</div>

<script>
  // ============================================
  // TAB SWITCHING
  // ============================================
  function switchTab(tabId, element) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    // Remove active from all nav items
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // Show selected tab
    document.getElementById('tab-' + tabId).classList.add('active');
    // Highlight nav item
    element.classList.add('active');
    
    // Update topbar title
    const titles = {
      'dashboard': 'Dashboard',
      'console': 'Console',
      'files': 'Files',
      'databases': 'Databases',
      'settings': 'Settings',
      'network': 'Network',
      'schedules': 'Schedules',
      'users': 'Users'
    };
    document.getElementById('topbar-title').textContent = titles[tabId] || 'Dashboard';
  }

  // ============================================
  // POWER STATE MANAGEMENT
  // ============================================
  let isRunning = true; // Assume running since dashboard is loaded

  function updateButtons() {
    const startBtn = document.getElementById('btn-start');
    const stopBtn = document.getElementById('btn-stop');
    const restartBtn = document.getElementById('btn-restart');
    const killBtn = document.getElementById('btn-kill');
    const statusText = document.getElementById('topbar-status-text');
    const statusDot = document.querySelector('.status-dot');

    if (isRunning) {
      startBtn.classList.add('hidden');
      stopBtn.classList.remove('hidden');
      restartBtn.classList.remove('hidden');
      killBtn.classList.remove('hidden');
      statusText.textContent = 'Running';
      statusDot.style.background = 'var(--success)';
      statusDot.style.boxShadow = '0 0 8px var(--success)';
      document.getElementById('status').textContent = 'ONLINE';
      document.getElementById('status').className = 'value online';
    } else {
      startBtn.classList.remove('hidden');
      stopBtn.classList.add('hidden');
      restartBtn.classList.remove('hidden');
      killBtn.classList.add('hidden');
      statusText.textContent = 'Stopped';
      statusDot.style.background = 'var(--danger)';
      statusDot.style.boxShadow = '0 0 8px var(--danger)';
      document.getElementById('status').textContent = 'OFFLINE';
      document.getElementById('status').className = 'value offline';
    }
  }

  // Initialize button state
  updateButtons();

  // ============================================
  // POWER ACTIONS
  // ============================================
  async function powerAction(action) {
    const time = new Date().toLocaleTimeString();
    let message = '';
    let className = 'info';

    if (action === 'start') {
      message = 'Received start signal. Bot is starting...';
      className = 'success';
      isRunning = true;
    } else if (action === 'restart') {
      message = 'Restart signal sent. Railway will restart the container.';
      className = 'warn';
    } else if (action === 'stop') {
      message = 'Stop signal sent. Container will be terminated.';
      className = 'error';
      isRunning = false;
    } else if (action === 'kill') {
      message = 'Kill signal sent. Force-terminating process.';
      className = 'error';
      isRunning = false;
    }

    addLog(time, message, className);
    updateButtons();

    // Send to server
    try {
      await fetch('/api/power/' + action, { method: 'POST' });
    } catch (e) {
      console.log('Power action sent:', action);
    }
  }

  // ============================================
  // CONSOLE LOGGING
  // ============================================
  function addLog(time, message, level = 'info') {
    const consoleEl = document.getElementById('console');
    const fullConsoleEl = document.getElementById('console-full');

    const lineHTML = \`<span class="timestamp">[\${time}]</span><span class="\${level}">\${message}</span>\`;

    // Add to dashboard console
    const line1 = document.createElement('div');
    line1.className = 'line';
    line1.innerHTML = lineHTML;
    consoleEl.appendChild(line1);

    // Add to full console
    const line2 = document.createElement('div');
    line2.className = 'line';
    line2.innerHTML = lineHTML;
    fullConsoleEl.appendChild(line2);

    // Keep only last 100 lines
    while (consoleEl.children.length > 100) consoleEl.removeChild(consoleEl.firstChild);
    while (fullConsoleEl.children.length > 200) fullConsoleEl.removeChild(fullConsoleEl.firstChild);

    // Auto-scroll
    consoleEl.scrollTop = consoleEl.scrollHeight;
    fullConsoleEl.scrollTop = fullConsoleEl.scrollHeight;
  }

  // ============================================
  // LIVE STATS POLLING
  // ============================================
  async function refreshStats() {
    try {
      const res = await fetch('/health');
      const data = await res.json();

      const uptime = data.uptime || 0;
      const hours = Math.floor(uptime / 3600);
      const mins = Math.floor((uptime % 3600) / 60);
      document.getElementById('uptime').textContent = \`\${hours}h \${mins}m\`;

      if (data.memory) {
        document.getElementById('memory').textContent = data.memory + ' MB';
      }

      // Simulate ping
      document.getElementById('ping').textContent = Math.floor(Math.random() * 50 + 20) + 'ms';

    } catch (e) {
      // silent fail
    }
  }

  setInterval(refreshStats, 5000);
  refreshStats();

  // ============================================
  // LOG STREAMING
  // ============================================
  async function refreshConsole() {
    try {
      const res = await fetch('/api/logs');
      const logs = await res.json();
      
      logs.forEach(log => {
        const time = log.time;
        const message = log.message;
        const level = log.level || 'info';
        
        // Only add if not already present (simple dedup)
        // For simplicity, we just add them. A real app would use WebSockets.
        addLog(time, message, level);
      });
    } catch (e) {
      // silent
    }
  }

  // Poll logs every 3 seconds
  setInterval(refreshConsole, 3000);
</script>
</body>
</html>`);
});

// ============================================
// API: POWER ACTIONS
// ============================================
app.post('/api/power/:action', express.json(), (req, res) => {
  const { action } = req.params;
  console.log(`[Panel] Power action requested: ${action}`);

  if (action === 'restart' || action === 'stop' || action === 'kill') {
    res.json({ ok: true, action });
    setTimeout(() => process.exit(0), 500);
    return;
  }

  res.json({ ok: true, action, note: 'Bot already running.' });
});

// ============================================
// API: LOGS (in-memory buffer)
// ============================================
const logBuffer = [];

// Intercept console.log to capture logs
const originalLog = console.log;
console.log = (...args) => {
  const time = new Date().toLocaleTimeString();
  logBuffer.push({ time, level: 'info', message: args.join(' ') });
  if (logBuffer.length > 200) logBuffer.shift();
  originalLog(...args);
};

const originalError = console.error;
console.error = (...args) => {
  const time = new Date().toLocaleTimeString();
  logBuffer.push({ time, level: 'error', message: args.join(' ') });
  if (logBuffer.length > 200) logBuffer.shift();
  originalError(...args);
};

app.get('/api/logs', (req, res) => {
  // Return only the last 10 lines to avoid flooding the UI
  res.json(logBuffer.slice(-10));
});

// ============================================
// START SERVER
// ============================================
export function startDashboard(port) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`[Panel] Dashboard running on port ${port}`);
  });
}
