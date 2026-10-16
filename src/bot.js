import { Client, GatewayIntentBits, Events, SlashCommandBuilder, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load .env file from the root directory
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('Check if the bot is alive'),
  new SlashCommandBuilder().setName('status').setDescription('Show bot uptime and server info'),
].map(cmd => cmd.toJSON());

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token) {
  console.error('[Bot] DISCORD_TOKEN is missing. Please add it to your .env file or Railway variables.');
  process.exit(1);
}

// Register commands
if (clientId) {
  const rest = new REST({ version: '10' }).setToken(token);
  rest.put(Routes.applicationCommands(clientId), { body: commands })
    .then(() => console.log('[Bot] Slash commands registered.'))
    .catch(err => console.error('[Bot] Failed to register commands:', err.message));
}

client.once(Events.ClientReady, (c) => {
  console.log(`[Bot] Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;

  if (commandName === 'ping') {
    await interaction.reply(`Pong! Latency: ${client.ws.ping}ms`);
  }
  if (commandName === 'status') {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const mins = Math.floor((uptime % 3600) / 60);
    await interaction.reply(`Uptime: ${hours}h ${mins}m | Ping: ${client.ws.ping}ms`);
  }
});

client.login(token);
