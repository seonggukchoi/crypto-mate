import axios from 'axios';
import { config } from '../config.js';
import { createLogger } from '../logger.js';
import { withRetry } from '../utils/retry.js';
import { cache } from '../cache/memory.js';
import type { Ticker24hr, Kline, KlineRaw, MarketData } from './types.js';

const logger = createLogger('binance');

class BinanceAPI {
  private baseUrl: string;

  constructor(baseUrl = config.binance.baseUrl) {
    this.baseUrl = baseUrl;
  }

  private parseKline(raw: KlineRaw): Kline {
    return {
      openTime: raw[0],
      open: raw[1],
      high: raw[2],
      low: raw[3],
      close: raw[4],
      volume: raw[5],
      closeTime: raw[6],
      quoteAssetVolume: raw[7],
      numberOfTrades: raw[8],
      takerBuyBaseAssetVolume: raw[9],
      takerBuyQuoteAssetVolume: raw[10],
      ignore: raw[11],
    };
  }

  async getTicker24hr(symbol: string): Promise<Ticker24hr> {
    const cacheKey = `ticker:${symbol}`;
    const cached = cache.get<Ticker24hr>(cacheKey);
    if (cached) return cached;

    try {
      const response = await withRetry(async () => {
        const res = await axios.get<Ticker24hr>(`${this.baseUrl}/api/v3/ticker/24hr`, {
          params: { symbol },
          timeout: 10000,
        });
        return res.data;
      });

      cache.set(cacheKey, response, 60000); // Cache for 60 seconds
      return response;
    } catch (error) {
      logger.error({ error, symbol }, 'Failed to fetch 24hr ticker');
      throw new Error(`Failed to fetch ticker data for ${symbol}`);
    }
  }

  async getKlines(
    symbol: string,
    interval: string = '1h',
    limit: number = 200,
  ): Promise<Kline[]> {
    const cacheKey = `klines:${symbol}:${interval}:${limit}`;
    const cached = cache.get<Kline[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await withRetry(async () => {
        const res = await axios.get<KlineRaw[]>(`${this.baseUrl}/api/v3/klines`, {
          params: { symbol, interval, limit },
          timeout: 10000,
        });
        return res.data;
      });

      const klines = response.map((k) => this.parseKline(k));
      cache.set(cacheKey, klines, 60000); // Cache for 60 seconds
      return klines;
    } catch (error) {
      logger.error({ error, symbol, interval, limit }, 'Failed to fetch klines');
      throw new Error(`Failed to fetch kline data for ${symbol}`);
    }
  }

  async getMarketData(
    symbol: string,
    timeframe: string = '1h',
  ): Promise<MarketData> {
    const [ticker, klines] = await Promise.all([
      this.getTicker24hr(symbol),
      this.getKlines(symbol, timeframe, 200),
    ]);

    return {
      symbol,
      price: parseFloat(ticker.lastPrice),
      priceChange24h: parseFloat(ticker.priceChange),
      priceChangePercent24h: parseFloat(ticker.priceChangePercent),
      volume24h: parseFloat(ticker.volume),
      high24h: parseFloat(ticker.highPrice),
      low24h: parseFloat(ticker.lowPrice),
      klines,
    };
  }

  async checkSymbolExists(symbol: string): Promise<boolean> {
    try {
      await this.getTicker24hr(symbol);
      return true;
    } catch {
      return false;
    }
  }
}

export const binance = new BinanceAPI();