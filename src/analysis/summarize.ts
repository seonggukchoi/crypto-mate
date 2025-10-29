import { config } from '../config.js';
import { createLogger } from '../logger.js';
import { AnthropicService } from '../llm/anthropic.js';
import { OpenAIService } from '../llm/openai.js';
import type { MarketData } from '../binance/types.js';
import type { EMAResult } from '../indicators/ema.js';
import type { RSISignal } from '../indicators/rsi.js';
import type { SupportResistance } from './supportResistance.js';

const logger = createLogger('summarize');

export interface MarketAnalysis {
  marketData: MarketData;
  ema: EMAResult;
  rsi: RSISignal;
  levels: SupportResistance;
  timeframe: string;
}

export class MarketSummarizer {
  private llmService: AnthropicService | OpenAIService;

  constructor() {
    if (config.llm.provider === 'anthropic') {
      this.llmService = new AnthropicService();
    } else {
      this.llmService = new OpenAIService();
    }
  }

  private formatPrice(price: number): string {
    if (price >= 1000) {
      return `${(price / 1000).toFixed(1)}K`;
    } else if (price >= 1) {
      return price.toFixed(2);
    } else {
      return price.toFixed(6);
    }
  }

  private formatVolume(volume: number): string {
    if (volume >= 1e9) {
      return `${(volume / 1e9).toFixed(1)}B`;
    } else if (volume >= 1e6) {
      return `${(volume / 1e6).toFixed(1)}M`;
    } else if (volume >= 1e3) {
      return `${(volume / 1e3).toFixed(1)}K`;
    } else {
      return volume.toFixed(2);
    }
  }

  private buildPrompt(analysis: MarketAnalysis): string {
    const { marketData, ema, rsi, levels } = analysis;

    const supportStr = levels.support.length > 0
      ? levels.support.map(s => this.formatPrice(s)).join(', ')
      : 'No clear support';

    const resistanceStr = levels.resistance.length > 0
      ? levels.resistance.map(r => this.formatPrice(r)).join(', ')
      : 'No clear resistance';

    return `You are a technical analyst. Provide a Korean market summary (2-4 lines) based on:

Market Data:
- Symbol: ${marketData.symbol}
- Price: $${this.formatPrice(marketData.price)}
- 24h Change: ${marketData.priceChangePercent24h.toFixed(2)}%
- Volume (24h): ${this.formatVolume(marketData.volume24h)} USDT

Technical Indicators:
- EMA20: ${ema.ema20 ? this.formatPrice(ema.ema20) : 'N/A'}
- EMA50: ${ema.ema50 ? this.formatPrice(ema.ema50) : 'N/A'}
- Trend: ${ema.trend} (EMA20 ${ema.trend === 'bullish' ? '>' : ema.trend === 'bearish' ? '<' : '≈'} EMA50)
- RSI(14): ${rsi.value?.toFixed(1) || 'N/A'} (${rsi.signal})

Key Levels:
- Support: ${supportStr}
- Resistance: ${resistanceStr}

Guidelines:
1. Be concise and objective
2. Focus on current market conditions
3. Mention key technical signals
4. Include one risk/caution point
5. NO investment advice or recommendations
6. Use Korean language
7. Keep it 2-4 lines maximum`;
  }

  async generateSummary(analysis: MarketAnalysis): Promise<string> {
    const prompt = this.buildPrompt(analysis);

    try {
      return await this.llmService.generateSummary(prompt);
    } catch (error) {
      logger.error({ error }, 'Failed to generate LLM summary, using fallback');
      return this.generateFallbackSummary(analysis);
    }
  }

  private generateFallbackSummary(analysis: MarketAnalysis): string {
    const { marketData, ema, rsi } = analysis;
    const changeEmoji = marketData.priceChangePercent24h >= 0 ? '📈' : '📉';

    let trendText = '';
    if (ema.trend === 'bullish') {
      trendText = 'EMA 골든크로스 형성으로 상승 추세';
    } else if (ema.trend === 'bearish') {
      trendText = 'EMA 데드크로스로 하락 추세';
    } else {
      trendText = 'EMA 크로스 근접, 추세 전환 주시';
    }

    let rsiText = '';
    if (rsi.signal === 'oversold') {
      rsiText = 'RSI 과매도 구간 진입';
    } else if (rsi.signal === 'overbought') {
      rsiText = 'RSI 과매수 구간 진입';
    } else {
      rsiText = 'RSI 중립 구간';
    }

    const summary = `${changeEmoji} ${marketData.symbol} 현재가 $${this.formatPrice(marketData.price)} (24h: ${marketData.priceChangePercent24h.toFixed(2)}%)
${trendText}. ${rsiText} (RSI: ${rsi.value?.toFixed(1) || 'N/A'}).
주의: 변동성이 클 수 있으니 리스크 관리 필수.`;

    return summary;
  }
}