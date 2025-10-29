import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  discord: z.object({
    token: z.string().min(1, 'Discord token is required'),
    appId: z.string().min(1, 'Discord app ID is required'),
    publicKey: z.string().min(1, 'Discord public key is required'),
  }),
  llm: z.object({
    provider: z.enum(['anthropic', 'openai']).default('anthropic'),
    anthropicKey: z.string().optional(),
    openaiKey: z.string().optional(),
  }),
  binance: z.object({
    baseUrl: z.string().url().default('https://api.binance.com'),
  }),
  cache: z.object({
    ttlSeconds: z.number().int().positive().default(60),
  }),
  app: z.object({
    defaultTimeframe: z
      .enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d'])
      .default('1h'),
    logLevel: z
      .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
      .default('info'),
  }),
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const rawConfig = {
    discord: {
      token: process.env.DISCORD_TOKEN,
      appId: process.env.DISCORD_APP_ID,
      publicKey: process.env.DISCORD_PUBLIC_KEY,
    },
    llm: {
      provider: process.env.LLM_PROVIDER || 'anthropic',
      anthropicKey: process.env.ANTHROPIC_API_KEY,
      openaiKey: process.env.OPENAI_API_KEY,
    },
    binance: {
      baseUrl: process.env.BINANCE_BASE_URL || 'https://api.binance.com',
    },
    cache: {
      ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '60', 10),
    },
    app: {
      defaultTimeframe: process.env.DEFAULT_TIMEFRAME || '1h',
      logLevel: process.env.LOG_LEVEL || 'info',
    },
  };

  try {
    const config = configSchema.parse(rawConfig);

    // Validate LLM provider keys
    if (config.llm.provider === 'anthropic' && !config.llm.anthropicKey) {
      throw new Error('Anthropic API key is required when using anthropic provider');
    }
    if (config.llm.provider === 'openai' && !config.llm.openaiKey) {
      throw new Error('OpenAI API key is required when using openai provider');
    }

    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation errors:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error('Configuration error:', error);
    }
    process.exit(1);
  }
}

export const config = loadConfig();