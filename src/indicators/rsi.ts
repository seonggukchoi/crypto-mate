/**
 * Relative Strength Index (RSI) calculation using Wilder's smoothing
 */

export function calculateRSI(values: number[], period: number = 14): number[] {
  if (values.length < period + 1) return [];
  if (period <= 0) throw new Error('Period must be positive');

  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  // Calculate price changes
  for (let i = 1; i < values.length; i++) {
    const change = values[i]! - values[i - 1]!;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  // Calculate initial average gain and loss
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    avgGain += gains[i]!;
    avgLoss += losses[i]!;
  }

  avgGain /= period;
  avgLoss /= period;

  // Calculate RSI using Wilder's smoothing
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]!) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]!) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - 100 / (1 + rs));
    }
  }

  return rsi;
}

export function getLatestRSI(values: number[], period: number = 14): number | null {
  const rsiValues = calculateRSI(values, period);
  return rsiValues.length > 0 ? rsiValues[rsiValues.length - 1]! : null;
}

export interface RSISignal {
  value: number | null;
  signal: 'oversold' | 'overbought' | 'neutral';
}

export function interpretRSI(rsiValue: number | null): RSISignal {
  if (rsiValue === null) {
    return { value: null, signal: 'neutral' };
  }

  let signal: 'oversold' | 'overbought' | 'neutral';
  if (rsiValue < 30) {
    signal = 'oversold';
  } else if (rsiValue > 70) {
    signal = 'overbought';
  } else {
    signal = 'neutral';
  }

  return { value: rsiValue, signal };
}