import { REST, Routes } from 'discord.js';
import { config } from './config.js';
import { createLogger } from './logger.js';
import { createDiscordClient } from './discord/client.js';
import { marketCommand, handleMarketCommand } from './discord/commands/market.js';
import { handleMention } from './discord/mention.js';
import { cache } from './cache/memory.js';

const logger = createLogger('main');

async function main() {
  logger.info('Starting CryptoMate Discord bot...');

  // Start cache cleanup
  cache.startCleanup();

  // Create Discord client
  const client = createDiscordClient();

  // Handle slash commands
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
      if (interaction.commandName === 'market') {
        await handleMarketCommand(interaction);
      }
    } catch (error) {
      logger.error({ error }, 'Failed to handle command interaction');
    }
  });

  // Handle mentions
  client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;

    try {
      await handleMention(message);
    } catch (error) {
      logger.error({ error }, 'Failed to handle message');
    }
  });

  // Login to Discord
  try {
    await client.login(config.discord.token);
    logger.info('Successfully logged in to Discord');
  } catch (error) {
    logger.fatal({ error }, 'Failed to login to Discord');
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled rejection');
  process.exit(1);
});

// Start the bot
main().catch((error) => {
  logger.fatal({ error }, 'Failed to start bot');
  process.exit(1);
});