import express from 'express';
import session from 'express-session';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { startBotProcess, stopBotProcess, restartBotProcess, isBotRunning } from './index.js';

const app = express();

// ============================================
// MIDDLEWARE & CONFIG
// ============================================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'codingboyz-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './'),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// Auth Middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated) return next();
  res.redirect('/login');
}

// ============================================
// LOGIN PAGE
// ============================================
const loginHTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Login</title>
<style>
  body { background: #0a0a0a; color: #fff; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
  .box { background: #111; border: 1px solid #2a2a2a; padding: 40px; border-radius: 10px; width: 350px; }
  h1 { text-align: center; font-size: 20px; letter-spacing: 2px; margin-bottom: 5px; }
  span { display: block; text-align: center; color: #555; font-size: 11px; margin-bottom: 30px; }
  input { width: 100%; padding: 12px; margin-bottom: 15px; background: #0a0a0a; border: 1px solid #2a2a2a; color: #fff; border-radius: 6px; box-sizing: border-box; }
  button { width: 100%; padding: 12px; background: #fff; color: #000; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
  .error { color: #ef4444; font-size: 12px; text-align: center; margin-top: 10px; display: none; }
</style></head><body>
<div class="box">
  <h1>BOT PANEL</h1><span>Made by CodingBoyz</span>
  <form id="login-form">
    <input type="email" id="email" placeholder="Email" required>
    <input type="password" id="password" placeholder="Password" required>
    <button type="submit">Sign In</button>
    <div class="error" id="error">Invalid credentials</div>
  </form>
</div>
<script>
  document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/login', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email: document.getElementById('email').value, password: document.getElementById('password').value })});
    const data = await res.json();
    if (data.success) window.location.href = '/';
    else document.getElementById('error').style.display = 'block';
  };
</script></body></html>`;

app.get('/login', (req, res) => {
  if (req.session.authenticated) return res.redirect('/');
  res.send(loginHTML);
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@codingboyz.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// ============================================
// API ROUTES (Files, Settings, Power)
// ============================================

// List files
app.get('/api/files', requireAuth, (req, res) => {
  try {
    const files = fs.readdirSync('./').filter(f => !f.startsWith('.') && f !== 'node_modules');
    const fileList = files.map(f => {
      const stats = fs.statSync(f);
      return { name: f, size: stats.size, isDirectory: stats.isDirectory() };
    });
    res.json(fileList);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Read file content
app.get('/api/files/content', requireAuth, (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'Path required' });
    const content = fs.readFileSync(filePath, 'utf8');
    res.json({ content });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Save file content
app.post('/api/files/save', requireAuth, (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    fs.writeFileSync(filePath, content, 'utf8');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Upload file
app.post('/api/files/upload', requireAuth, upload.single('file'), (req, res) => {
  res.json({ success: true, filename: req.file.filename });
});

// Delete file
app.post('/api/files/delete', requireAuth, (req, res) => {
  try {
    fs.unlinkSync(req.body.path);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get config
app.get('/api/settings', requireAuth, (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    res.json(config);
  } catch (e) { res.json({ runtime: 'node', startupCommand: 'node src/bot.js', version: '20', autoRestart: true }); }
});

// Save config
app.post('/api/settings', requireAuth, (req, res) => {
  try {
    fs.writeFileSync('config.json', JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Power Actions
app.post('/api/power/:action', requireAuth, (req, res) => {
  const { action } = req.params;
  if (action === 'start') { startBotProcess(); res.json({ success: true, message: 'Bot starting...' }); }
  else if (action === 'stop') { stopBotProcess(); res.json({ success: true, message: 'Bot stopping...' }); }
  else if (action === 'restart') { restartBotProcess(); res.json({ success: true, message: 'Bot restarting...' }); }
  else if (action === 'kill') { stopBotProcess(); res.json({ success: true, message: 'Bot killed.' }); }
});

// Logs endpoint
app.get('/api/logs', requireAuth, (req, res) => {
  // Simple in-memory log buffer
  res.json(logBuffer.slice(-50));
});

// ============================================
// LOG BUFFER (For console)
// ============================================
const logBuffer = [];
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

// ============================================
// MAIN DASHBOARD UI
// ============================================
app.get('/', requireAuth, (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><title>Bot Panel</title>
<style>
  :root { --bg: #0a0a0a; --bg2: #111; --bg3: #1a1a1a; --border: #2a2a2a; --text: #fff; --text2: #888; --text3: #555; --acc: #fff; --success: #22c55e; --danger: #ef4444; --warn: #f59e0b; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, sans-serif; background: var(--bg); color: var(--text); display: flex; height: 100vh; overflow: hidden; }
  
  /* Sidebar */
  .sidebar { width: 240px; background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; }
  .side-header { padding: 24px; border-bottom: 1px solid var(--border); }
  .side-header h1 { font-size: 18px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
  .side-header span { font-size: 11px; color: var(--text3); display: block; margin-top: 4px; }
  .nav-item { padding: 14px 24px; display: flex; align-items: center; gap: 12px; color: var(--text2); cursor: pointer; border-left: 3px solid transparent; font-size: 14px; transition: 0.2s; }
  .nav-item:hover, .nav-item.active { background: var(--bg3); color: var(--text); border-left-color: var(--acc); }
  
  /* Main */
  .main { flex: 1; display: flex; flex-direction: column; }
  .topbar { height: 60px; background: var(--bg2); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 30px; }
  .topbar-title { font-size: 16px; font-weight: 600; }
  .topbar-right { display: flex; align-items: center; gap: 20px; }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--success); display: inline-block; margin-right: 8px; }
  .logout-btn { background: transparent; border: 1px solid var(--border); color: var(--text2); padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; text-transform: uppercase; }
  .logout-btn:hover { background: var(--danger); color: #fff; border-color: var(--danger); }
  
  /* Content */
  .content { flex: 1; padding: 30px; overflow-y: auto; }
  .tab { display: none; } .tab.active { display: block; }
  
  /* Files */
  .file-manager { display: flex; gap: 20px; height: calc(100vh - 150px); }
  .file-list { width: 300px; background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; overflow-y: auto; }
  .file-item { padding: 12px 15px; border-bottom: 1px solid var(--border); cursor: pointer; font-size: 13px; display: flex; justify-content: space-between; }
  .file-item:hover { background: var(--bg3); }
  .file-item.active { background: var(--bg3); border-left: 3px solid var(--acc); }
  .file-editor { flex: 1; display: flex; flex-direction: column; background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; }
  .editor-header { padding: 10px 15px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
  .editor-header input { background: var(--bg); border: 1px solid var(--border); color: var(--text); padding: 5px 10px; border-radius: 4px; }
  textarea { flex: 1; background: var(--bg); color: var(--text); border: none; padding: 15px; font-family: monospace; font-size: 13px; resize: none; outline: none; }
  .btn { background: var(--acc); color: var(--bg); border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px; }
  .btn:hover { opacity: 0.8; }
  .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
  .btn-outline:hover { background: var(--bg3); }
  
  /* Settings */
  .setting-group { background: var(--bg2); border: 1px solid var(--border); padding: 20px; border-radius: 8px; margin-bottom: 20px; }
  .setting-group label { display: block; font-size: 12px; color: var(--text2); margin-bottom: 8px; text-transform: uppercase; }
  .setting-group input, .setting-group select { width: 100%; padding: 10px; background: var(--bg); border: 1px solid var(--border); color: var(--text); border-radius: 6px; margin-bottom: 15px; }
  
  /* Console */
  .console-box { background: #000; border: 1px solid var(--border); border-radius: 8px; padding: 15px; font-family: monospace; font-size: 12px; height: calc(100vh - 150px); overflow-y: auto; }
  .log-line { margin-bottom: 4px; display: flex; gap: 10px; }
  .log-time { color: var(--text3); }
  .log-info { color: var(--text); } .log-error { color: var(--danger); } .log-warn { color: var(--warn); }
  
  /* Buttons Grid */
  .power-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
  .power-btn { background: var(--bg2); border: 1px solid var(--border); border-radius: 8px; padding: 20px; cursor: pointer; color: var(--text); font-weight: 600; text-align: center; transition: 0.2s; }
  .power-btn:hover { background: var(--bg3); transform: translateY(-2px); }
  .power-btn.start { border-top: 3px solid var(--success); }
  .power-btn.stop { border-top: 3px solid var(--danger); }
  .power-btn.restart { border-top: 3px solid var(--warn); }
  .power-btn.kill { border-top: 3px solid #ff0000; }
</style>
</head>
<body>

<aside class="sidebar">
  <div class="side-header"><h1>Bot Panel</h1><span>Made by CodingBoyz</span></div>
  <div class="nav-item active" onclick="switchTab('dashboard', this)">◉ Dashboard</div>
  <div class="nav-item" onclick="switchTab('files', this)">▦ Files</div>
  <div class="nav-item" onclick="switchTab('settings', this)">⚙ Settings</div>
  <div class="nav-item" onclick="switchTab('console', this)">▤ Console</div>
</aside>

<div class="main">
  <div class="topbar">
    <div class="topbar-title" id="topbar-title">Dashboard</div>
    <div class="topbar-right">
      <div><span class="status-dot" id="status-dot"></span><span id="status-text">Running</span></div>
      <a href="/logout" class="logout-btn">Logout</a>
    </div>
  </div>

  <div class="content">
    <!-- DASHBOARD TAB -->
    <div class="tab active" id="tab-dashboard">
      <div class="power-grid">
        <button class="power-btn start" onclick="powerAction('start')">▶ Start</button>
        <button class="power-btn restart" onclick="powerAction('restart')">↻ Restart</button>
        <button class="power-btn stop" onclick="powerAction('stop')">■ Stop</button>
        <button class="power-btn kill" onclick="powerAction('kill')">✕ Kill</button>
      </div>
      <div class="setting-group">
        <h3>Quick Stats</h3>
        <p style="color:var(--text2);margin-top:10px;">Status: <span id="quick-status" style="color:var(--success);">Online</span></p>
        <p style="color:var(--text2);margin-top:5px;">Uptime: <span id="quick-uptime">0h 0m</span></p>
      </div>
    </div>

    <!-- FILES TAB -->
    <div class="tab" id="tab-files">
      <div class="file-manager">
        <div class="file-list" id="file-list">
          <!-- Files loaded here -->
        </div>
        <div class="file-editor">
          <div class="editor-header">
            <input type="text" id="current-file" placeholder="Select or create a file..." readonly style="width:200px;">
            <div>
              <input type="file" id="file-upload" style="display:none;" onchange="uploadFile(this)">
              <button class="btn btn-outline" onclick="document.getElementById('file-upload').click()">⬆ Upload</button>
              <button class="btn btn-outline" onclick="createNewFile()">+ New File</button>
              <button class="btn" onclick="saveFile()">💾 Save</button>
            </div>
          </div>
          <textarea id="file-content" placeholder="Select a file to edit..."></textarea>
        </div>
      </div>
    </div>

    <!-- SETTINGS TAB -->
    <div class="tab" id="tab-settings">
      <div class="setting-group">
        <h3>Runtime Configuration</h3>
        <label>Runtime Environment</label>
        <select id="set-runtime">
          <option value="node">Node.js (discord.js)</option>
          <option value="python">Python (discord.py)</option>
          <option value="ruby">Ruby (discordrb)</option>
        </select>
        <label>Runtime Version</label>
        <input type="text" id="set-version" placeholder="e.g., 20, 3.11, 3.2">
        <label>Startup Command</label>
        <input type="text" id="set-command" placeholder="e.g., node src/bot.js">
        <label>Auto Restart on Crash</label>
        <select id="set-restart"><option value="true">Enabled</option><option value="false">Disabled</option></select>
        <button class="btn" onclick="saveSettings()">Save Settings</button>
      </div>
    </div>

    <!-- CONSOLE TAB -->
    <div class="tab" id="tab-console">
      <div class="console-box" id="console-box">
        <div class="log-line"><span class="log-time">[00:00:00]</span><span class="log-info">Panel initialized. Waiting for logs...</span></div>
      </div>
    </div>
  </div>
</div>

<script>
  // TABS
  function switchTab(name, el) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    el.classList.add('active');
    document.getElementById('topbar-title').textContent = name.charAt(0).toUpperCase() + name.slice(1);
    
    if (name === 'files') loadFileList();
    if (name === 'settings') loadSettings();
    if (name === 'console') refreshConsole();
  }

  // FILES
  let currentFile = '';
  async function loadFileList() {
    const res = await fetch('/api/files');
    const files = await res.json();
    const list = document.getElementById('file-list');
    list.innerHTML = files.map(f => \`<div class="file-item" onclick="openFile('\${f.name}', this)"><span>\${f.name}</span><span style="color:var(--text3)">\${(f.size/1024).toFixed(1)}kb</span></div>\`).join('');
  }
  
  async function openFile(name, el) {
    currentFile = name;
    document.getElementById('current-file').value = name;
    document.querySelectorAll('.file-item').forEach(i => i.classList.remove('active'));
    if (el) el.classList.add('active');
    const res = await fetch('/api/files/content?path=' + encodeURIComponent(name));
    const data = await res.json();
    document.getElementById('file-content').value = data.content || '';
  }

  async function saveFile() {
    if (!currentFile) return alert('No file selected');
    const content = document.getElementById('file-content').value;
    await fetch('/api/files/save', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ path: currentFile, content }) });
    alert('File saved!');
  }

  async function createNewFile() {
    const name = prompt('Enter file name (e.g., bot.py, .env):');
    if (!name) return;
    await fetch('/api/files/save', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ path: name, content: '' }) });
    loadFileList();
  }

  async function uploadFile(input) {
    const file = input.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    await fetch('/api/files/upload', { method: 'POST', body: formData });
    loadFileList();
    alert('Uploaded!');
  }

  // SETTINGS
  async function loadSettings() {
    const res = await fetch('/api/settings');
    const s = await res.json();
    document.getElementById('set-runtime').value = s.runtime || 'node';
    document.getElementById('set-version').value = s.version || '20';
    document.getElementById('set-command').value = s.startupCommand || 'node src/bot.js';
    document.getElementById('set-restart').value = s.autoRestart ? 'true' : 'false';
  }

  async function saveSettings() {
    const config = {
      runtime: document.getElementById('set-runtime').value,
      version: document.getElementById('set-version').value,
      startupCommand: document.getElementById('set-command').value,
      autoRestart: document.getElementById('set-restart').value === 'true'
    };
    await fetch('/api/settings', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(config) });
    alert('Settings saved! Restart the bot to apply.');
  }

  // POWER
  async function powerAction(action) {
    await fetch('/api/power/' + action, { method: 'POST' });
    refreshStats();
  }

  // STATS & LOGS
  async function refreshStats() {
    try {
      const res = await fetch('/health');
      const data = await res.json();
      const uptime = data.uptime || 0;
      const hours = Math.floor(uptime / 3600);
      const mins = Math.floor((uptime % 3600) / 60);
      document.getElementById('quick-uptime').textContent = \`\${hours}h \${mins}m\`;
    } catch (e) {}
  }

  async function refreshConsole() {
    try {
      const res = await fetch('/api/logs');
      const logs = await res.json();
      const box = document.getElementById('console-box');
      box.innerHTML = logs.map(l => \`<div class="log-line"><span class="log-time">[\${l.time}]</span><span class="log-\${l.level}">\${l.message}</span></div>\`).join('');
      box.scrollTop = box.scrollHeight;
    } catch (e) {}
  }

  setInterval(refreshStats, 5000);
  setInterval(refreshConsole, 3000);
  refreshStats();
  refreshConsole();
</script>
</body>
</html>`);
});

export function startDashboard(port) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`[Panel] Dashboard running on port ${port}`);
  });
}
