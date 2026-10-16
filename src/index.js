import { startDashboard } from './dashboard.js';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
let botProcess = null;

// ============================================
// CONFIG MANAGEMENT
// ============================================
function getConfig() {
  try {
    const configPath = path.join(process.cwd(), 'config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    console.error('[System] Failed to read config.json:', e.message);
  }
  return { runtime: 'node', startupCommand: 'node src/bot.js', autoRestart: true };
}

// ============================================
// BOT PROCESS MANAGER
// ============================================
export function startBotProcess() {
  if (botProcess) {
    console.log('[System] Bot process is already running.');
    return;
  }

  const config = getConfig();
  const command = config.startupCommand || 'node src/bot.js';
  const args = command.split(' ').slice(1);
  const cmd = command.split(' ')[0];

  console.log(`[System] Starting bot: ${command}`);

  // Spawn the bot process
  botProcess = spawn(cmd, args, {
    cwd: process.cwd(),
    env: { ...process.env },
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Pipe bot logs to the dashboard console
  botProcess.stdout.on('data', (data) => {
    console.log(`[Bot] ${data.toString().trim()}`);
  });

  botProcess.stderr.on('data', (data) => {
    console.error(`[Bot] ${data.toString().trim()}`);
  });

  botProcess.on('close', (code) => {
    console.log(`[System] Bot process exited with code ${code}`);
    botProcess = null;
    
    // Auto-restart if enabled
    const currentConfig = getConfig();
    if (currentConfig.autoRestart && code !== 0) {
      console.log('[System] Auto-restarting bot in 5 seconds...');
      setTimeout(startBotProcess, 5000);
    }
  });
}

export function stopBotProcess() {
  if (botProcess) {
    console.log('[System] Stopping bot process...');
    botProcess.kill('SIGTERM');
    setTimeout(() => {
      if (botProcess) {
        botProcess.kill('SIGKILL');
        botProcess = null;
      }
    }, 3000);
  }
}

export function restartBotProcess() {
  stopBotProcess();
  setTimeout(startBotProcess, 2000);
}

export function isBotRunning() {
  return botProcess !== null;
}

// ============================================
// START SYSTEM
// ============================================
startDashboard(PORT);

// Start the bot after a short delay to let the dashboard boot
setTimeout(() => {
  console.log('[System] Initializing bot process...');
  startBotProcess();
}, 3000);
