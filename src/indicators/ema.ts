/**
 * Exponential Moving Average (EMA) calculation
 */

export function calculateEMA(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  if (period <= 0) throw new Error('Period must be positive');
  if (values.length < period) return [];

  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  // Calculate initial SMA as the seed for EMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i]!;
  }
  ema[period - 1] = sum / period;

  // Calculate EMA for remaining values
  for (let i = period; i < values.length; i++) {
    const prevEMA = ema[i - 1]!;
    const currentValue = values[i]!;
    ema[i] = (currentValue - prevEMA) * multiplier + prevEMA;
  }

  return ema;
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