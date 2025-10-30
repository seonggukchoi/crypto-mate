/**
 * Relative Strength Index (RSI) calculation using technicalindicators library
 */
import { RSI } from 'technicalindicators';

export function calculateRSI(values: number[], period: number = 14): number[] {
  if (values.length < period + 1) return [];
  if (period <= 0) throw new Error('Period must be positive');

  // Use the technicalindicators library for RSI calculation
  const result = RSI.calculate({
    period: period,
    values: values
  });

  return result;
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