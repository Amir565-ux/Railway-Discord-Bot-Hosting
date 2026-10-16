import { startBot } from './bot.js';
import { startDashboard } from './dashboard.js';

const PORT = process.env.PORT || 3000;

// Start the web dashboard and bot together
startDashboard(PORT);
startBot();

console.log(`[System] Bot and dashboard starting on port ${PORT}...`);
