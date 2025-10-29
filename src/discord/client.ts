import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { createLogger } from '../logger.js';

const logger = createLogger('discord-client');

export function createDiscordClient(): Client {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
  });

  client.once('ready', () => {
    logger.info({
      username: client.user?.username,
      id: client.user?.id
    }, 'Discord bot is ready!');
  });

  client.on('error', (error) => {
    logger.error({ error }, 'Discord client error');
  });

  client.on('warn', (warning) => {
    logger.warn({ warning }, 'Discord client warning');
  });

  return client;
}