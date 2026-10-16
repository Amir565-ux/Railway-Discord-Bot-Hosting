import express from 'express';

const app = express();

// ============================================
// HEALTH CHECK (required by Railway)
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// ============================================
// MAIN DASHBOARD
// ============================================
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bot Panel — Dashboard</title>
<style>
  :root {
    --bg-primary: #0a0a0a;
    --bg-secondary: #111111;
    --bg-tertiary: #1a1a1a;
    --border: #2a2a2a;
    --text-primary: #ffffff;
    --text-secondary: #888888;
    --text-muted: #555555;
    --accent: #ffffff;
    --danger: #ff4444;
    --success: #44ff44;
    --warning: #ffaa00;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    min-height: 100vh;
    display: flex;
  }

  /* ============================================
     SIDEBAR (Pterodactyl-style navigation)
     ============================================ */
  .sidebar {
    width: 240px;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border);
    padding: 24px 0;
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
  }

  .sidebar-header {
    padding: 0 20px 24px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 16px;
  }

  .sidebar-header h1 {
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .sidebar-header span {
    font-size: 11px;
    color: var(--text-muted);
    display: block;
    margin-top: 4px;
  }

  .nav-item {
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-secondary);
    text-decoration: none;
    font-size: 14px;
    border-left: 3px solid transparent;
    transition: all 0.15s;
    cursor: pointer;
  }

  .nav-item:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .nav-item.active {
    border-left-color: var(--accent);
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .nav-icon {
    width: 18px;
    height: 18px;
    opacity: 0.7;
  }

  /* ============================================
     MAIN CONTENT
     ============================================ */
  .main {
    margin-left: 240px;
    flex: 1;
    padding: 32px 40px;
    max-width: 1200px;
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
     STATUS BAR
     ============================================ */
  .status-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 32px;
    flex-wrap: wrap;
  }

  .status-card {
    flex: 1;
    min-width: 160px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px;
  }

  .status-card .label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
    margin-bottom: 8px;
  }

  .status-card .value {
    font-size: 22px;
    font-weight: 700;
  }

  .status-card .value.online { color: var(--success); }
  .status-card .value.offline { color: var(--danger); }

  /* ============================================
     POWER CONTROLS (Pterodactyl-style buttons)
     ============================================ */
  .power-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 32px;
  }

  .power-btn {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px;
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .power-btn:hover {
    background: var(--bg-tertiary);
    border-color: var(--text-muted);
    transform: translateY(-2px);
  }

  .power-btn.start { border-top: 3px solid var(--success); }
  .power-btn.restart { border-top: 3px solid var(--warning); }
  .power-btn.stop { border-top: 3px solid var(--danger); }
  .power-btn.kill { border-top: 3px solid #ff0000; }

  .power-btn .icon {
    font-size: 24px;
    line-height: 1;
  }

  .power-btn .btn-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-secondary);
  }

  /* ============================================
     CONSOLE (Pterodactyl-style live console)
     ============================================ */
  .console-box {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 32px;
  }

  .console-header {
    padding: 12px 16px;
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .console-header h3 {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-secondary);
  }

  .console-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--success);
    display: inline-block;
    margin-right: 8px;
  }

  .console-output {
    padding: 16px;
    font-family: 'SF Mono', 'Fira Code', monospace;
    font-size: 13px;
    line-height: 1.7;
    max-height: 400px;
    overflow-y: auto;
    color: var(--text-secondary);
  }

  .console-output .line {
    margin-bottom: 2px;
  }

  .console-output .line .timestamp {
    color: var(--text-muted);
    margin-right: 8px;
  }

  .console-output .line .info { color: var(--text-primary); }
  .console-output .line .warn { color: var(--warning); }
  .console-output .line .error { color: var(--danger); }

  /* ============================================
     RESPONSIVE
     ============================================ */
  @media (max-width: 768px) {
    .sidebar { display: none; }
    .main { margin-left: 0; padding: 20px; }
    .power-grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>
</head>
<body>

<!-- SIDEBAR -->
<aside class="sidebar">
  <div class="sidebar-header">
    <h1>Bot Panel</h1>
    <span>Discord Bot Hosting</span>
  </div>
  <a class="nav-item active" href="#">
    <span class="nav-icon">◉</span> Dashboard
  </a>
  <a class="nav-item" href="#">
    <span class="nav-icon">▤</span> Console
  </a>
  <a class="nav-item" href="#">
    <span class="nav-icon">▦</span> Files
  </a>
  <a class="nav-item" href="#">
    <span class="nav-icon">◈</span> Databases
  </a>
  <a class="nav-item" href="#">
    <span class="nav-icon">⚙</span> Settings
  </a>
  <a class="nav-item" href="#">
    <span class="nav-icon">⇄</span> Network
  </a>
  <a class="nav-item" href="#">
    <span class="nav-icon">◷</span> Schedules
  </a>
  <a class="nav-item" href="#">
    <span class="nav-icon">◈</span> Users
  </a>
</aside>

<!-- MAIN CONTENT -->
<main class="main">
  <h1 class="page-title">Dashboard</h1>
  <p class="page-subtitle">Monitor and control your Discord bot</p>

  <!-- STATUS BAR -->
  <div class="status-bar">
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
    <button class="power-btn start" onclick="powerAction('start')">
      <span class="icon">▶</span>
      <span class="btn-label">Start</span>
    </button>
    <button class="power-btn restart" onclick="powerAction('restart')">
      <span class="icon">↻</span>
      <span class="btn-label">Restart</span>
    </button>
    <button class="power-btn stop" onclick="powerAction('stop')">
      <span class="icon">■</span>
      <span class="btn-label">Stop</span>
    </button>
    <button class="power-btn kill" onclick="powerAction('kill')">
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
      <div class="line"><span class="timestamp">[00:00:00]</span><span class="info">Bot initialized. Waiting for events...</span></div>
    </div>
  </div>
</main>

<script>
  // ============================================
  // POWER ACTIONS
  // ============================================
  async function powerAction(action) {
    const consoleEl = document.getElementById('console');
    const time = new Date().toLocaleTimeString();

    let message = '';
    let className = 'info';

    if (action === 'start') {
      message = 'Received start signal. Bot is already running.';
      className = 'info';
    } else if (action === 'restart') {
      message = 'Restart signal sent. Railway will restart the container.';
      className = 'warn';
    } else if (action === 'stop') {
      message = 'Stop signal sent. Container will be terminated.';
      className = 'error';
    } else if (action === 'kill') {
      message = 'Kill signal sent. Force-terminating process.';
      className = 'error';
    }

    const line = document.createElement('div');
    line.className = 'line';
    line.innerHTML = \`<span class="timestamp">[\${time}]</span><span class="\${className}">\${message}</span>\`;
    consoleEl.appendChild(line);
    consoleEl.scrollTop = consoleEl.scrollHeight;

    // Send to server (Railway will handle restart via process.exit)
    try {
      await fetch('/api/power/' + action, { method: 'POST' });
    } catch (e) {
      console.log('Power action sent:', action);
    }
  }

  // ============================================
  // LIVE STATS POLLING
  // ============================================
  async function refreshStats() {
    try {
      const res = await fetch('/health');
      const data = await res.json();

      // Uptime
      const uptime = data.uptime || 0;
      const hours = Math.floor(uptime / 3600);
      const mins = Math.floor((uptime % 3600) / 60);
      document.getElementById('uptime').textContent = \`\${hours}h \${mins}m\`;

      // Memory (from health endpoint)
      if (data.memory) {
        document.getElementById('memory').textContent = data.memory + ' MB';
      }
    } catch (e) {
      document.getElementById('status').textContent = 'OFFLINE';
      document.getElementById('status').className = 'value offline';
    }
  }

  setInterval(refreshStats, 5000);
  refreshStats();

  // ============================================
  // CONSOLE LOG STREAMING
  // ============================================
  async function refreshConsole() {
    try {
      const res = await fetch('/api/logs');
      const logs = await res.json();
      const consoleEl = document.getElementById('console');

      logs.forEach(log => {
        const line = document.createElement('div');
        line.className = 'line';
        line.innerHTML = \`<span class="timestamp">[\${log.time}]</span><span class="\${log.level}">\${log.message}</span>\`;
        consoleEl.appendChild(line);
      });

      // Keep only last 100 lines
      while (consoleEl.children.length > 100) {
        consoleEl.removeChild(consoleEl.firstChild);
      }

      consoleEl.scrollTop = consoleEl.scrollHeight;
    } catch (e) {
      // silent
    }
  }

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
    // Railway will auto-restart on process exit
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
  res.json(logBuffer.slice(-20)); // Return last 20 lines
});

// ============================================
// START SERVER
// ============================================
export function startDashboard(port) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`[Panel] Dashboard running on port ${port}`);
  });
}
