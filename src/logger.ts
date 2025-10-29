import pino from 'pino';
import { config } from './config.js';

export const logger = pino({
  level: config.app.logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  redact: {
    paths: [
      'config.discord.token',
      'config.llm.anthropicKey',
      'config.llm.openaiKey',
      '*.apiKey',
      '*.token',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
});

// Create child loggers for different modules
export const createLogger = (module: string) => {
  return logger.child({ module });
};