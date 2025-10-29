import OpenAI from 'openai';
import { config } from '../config.js';
import { createLogger } from '../logger.js';

const logger = createLogger('openai');

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string = config.llm.openaiKey!) {
    this.client = new OpenAI({ apiKey });
  }

  async generateSummary(prompt: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a concise and objective market analyst. Provide brief, factual analysis without investment advice.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return content;
      }

      throw new Error('Invalid response from OpenAI API');
    } catch (error) {
      logger.error({ error }, 'Failed to generate summary with OpenAI');
      throw error;
    }
  }
}