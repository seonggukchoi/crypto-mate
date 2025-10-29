import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { createLogger } from '../logger.js';

const logger = createLogger('anthropic');

export class AnthropicService {
  private client: Anthropic;

  constructor(apiKey: string = config.llm.anthropicKey!) {
    this.client = new Anthropic({ apiKey });
  }

  async generateSummary(prompt: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content && content.type === 'text') {
        return content.text;
      }

      throw new Error('Invalid response from Anthropic API');
    } catch (error) {
      logger.error({ error }, 'Failed to generate summary with Anthropic');
      throw error;
    }
  }
}