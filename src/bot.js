import { Client, GatewayIntentBits, Events, SlashCommandBuilder, REST, Routes } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ============================================
// SLASH COMMANDS (Pterodactyl-style power controls)
// ============================================
const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if the bot is alive'),
  new SlashCommandBuilder()
    .setName('status')
    .setDescription('Show bot uptime and server info'),
  new SlashCommandBuilder()
    .setName('restart')
    .setDescription('Restart the bot process'),
].map(cmd => cmd.toJSON());

export async function startBot() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token) {
    console.error('[Bot] DISCORD_TOKEN is missing. Bot will not start.');
    return;
  }

  // Register slash commands
  if (clientId) {
    const rest = new REST({ version: '10' }).setToken(token);
    try {
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('[Bot] Slash commands registered.');
    } catch (err) {
      console.error('[Bot] Failed to register commands:', err.message);
    }
  }

  client.once(Events.ClientReady, (c) => {
    console.log(`[Bot] Logged in as ${c.user.tag}`);
    console.log(`[Bot] Serving ${c.guilds.cache.size} guild(s)`);
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
      await interaction.reply(
        `**Bot Status**\n` +
        `• Uptime: ${hours}h ${mins}m\n` +
        `• Ping: ${client.ws.ping}ms\n` +
        `• Guilds: ${client.guilds.cache.size}\n` +
        `• Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)} MB`
      );
    }

    if (commandName === 'restart') {
      await interaction.reply('Restarting...');
      process.exit(0); // Railway will auto-restart
    }
  });

  client.on(Events.Error, (err) => {
    console.error('[Bot] Client error:', err.message);
  });

  try {
    await client.login(token);
  } catch (err) {
    console.error('[Bot] Login failed:', err.message);
  }
}
