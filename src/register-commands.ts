import { REST, Routes } from 'discord.js';
import { config } from './config.js';
import { createLogger } from './logger.js';
import { marketCommand } from './discord/commands/market.js';

const logger = createLogger('register-commands');

async function registerCommands() {
  const commands = [marketCommand.toJSON()];

  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  try {
    logger.info('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(config.discord.appId),
      { body: commands },
    );

    logger.info(`Successfully registered ${commands.length} application commands globally.`);
  } catch (error) {
    logger.error({ error }, 'Failed to register commands');
    process.exit(1);
  }
}

registerCommands()
  .then(() => {
    logger.info('Command registration complete');
    process.exit(0);
  })
  .catch((error) => {
    logger.fatal({ error }, 'Command registration failed');
    process.exit(1);
  });