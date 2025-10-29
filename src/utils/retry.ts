import { createLogger } from '../logger.js';

const logger = createLogger('retry');

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 200,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  shouldRetry: (error) => {
    // Retry on network errors and 5xx status codes
    if (error instanceof Error) {
      return error.message.includes('ECONNREFUSED') ||
             error.message.includes('ETIMEDOUT') ||
             error.message.includes('ENOTFOUND') ||
             error.message.includes('rate limit');
    }
    return true;
  },
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: unknown;
  let delayMs = opts.initialDelayMs;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === opts.maxAttempts || !opts.shouldRetry(error)) {
        logger.error({ error, attempt }, 'Max retries exceeded or error not retryable');
        throw error;
      }

      logger.warn(
        { error, attempt, nextDelayMs: delayMs },
        `Attempt ${attempt} failed, retrying...`,
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
      delayMs = Math.min(delayMs * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  throw lastError;
}