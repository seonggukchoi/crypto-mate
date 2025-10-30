/**
 * Exponential Moving Average (EMA) calculation using technicalindicators library
 */
import { EMA } from 'technicalindicators';

export function calculateEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  if (period <= 0) throw new Error('Period must be positive');
  if (values.length < period) return [];

  // Use the technicalindicators library for EMA calculation
  const result = EMA.calculate({
    period: period,
    values: values
  });

  // The library returns a compact array without the initial undefined values
  // We need to pad it to match the original implementation's behavior
  const paddedResult: number[] = new Array(period - 1);
  return paddedResult.concat(result);
}

export function getLatestEMA(values: number[], period: number): number | null {
  const emaValues = calculateEMA(values, period);
  return emaValues.length > 0 ? emaValues[emaValues.length - 1]! : null;
}

export interface EMAResult {
  ema20: number | null;
  ema50: number | null;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export function calculateEMACrossover(closePrices: number[]): EMAResult {
  const ema20 = getLatestEMA(closePrices, 20);
  const ema50 = getLatestEMA(closePrices, 50);

  let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';

  if (ema20 !== null && ema50 !== null) {
    const diff = (ema20 - ema50) / ema50;
    if (diff > 0.001) trend = 'bullish';
    else if (diff < -0.001) trend = 'bearish';
    else trend = 'neutral';
  }

  return { ema20, ema50, trend };
}