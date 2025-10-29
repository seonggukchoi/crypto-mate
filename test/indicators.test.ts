import { describe, it, expect } from 'vitest';
import { calculateEMA, getLatestEMA, calculateEMACrossover } from '../src/indicators/ema';
import { calculateRSI, getLatestRSI, interpretRSI } from '../src/indicators/rsi';

describe('EMA Indicator', () => {
  it('should calculate EMA correctly', () => {
    const values = [
      100, 102, 101, 103, 104, 102, 105, 106, 104, 107,
      108, 107, 109, 110, 108, 111, 112, 110, 113, 114,
    ];
    const ema = calculateEMA(values, 5);
    expect(ema.length).toBeGreaterThan(0);
    expect(ema[ema.length - 1]).toBeCloseTo(112.0, 1);
  });

  it('should return empty array for insufficient data', () => {
    const values = [100, 102];
    const ema = calculateEMA(values, 5);
    expect(ema).toEqual([]);
  });

  it('should detect bullish crossover', () => {
    const bullishPrices = Array.from({ length: 100 }, (_, i) => 100 + i * 0.5);
    const result = calculateEMACrossover(bullishPrices);
    expect(result.trend).toBe('bullish');
    expect(result.ema20).not.toBeNull();
    expect(result.ema50).not.toBeNull();
  });

  it('should detect bearish crossover', () => {
    const bearishPrices = Array.from({ length: 100 }, (_, i) => 200 - i * 0.5);
    const result = calculateEMACrossover(bearishPrices);
    expect(result.trend).toBe('bearish');
  });

  it('should handle getLatestEMA', () => {
    const values = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i) * 10);
    const latest = getLatestEMA(values, 20);
    expect(latest).not.toBeNull();
    expect(typeof latest).toBe('number');
  });
});

describe('RSI Indicator', () => {
  it('should calculate RSI correctly', () => {
    const values = [
      44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42,
      45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28, 46.00,
      46.03, 46.41, 46.22, 45.64,
    ];
    const rsi = calculateRSI(values, 14);
    expect(rsi.length).toBeGreaterThan(0);
    // RSI should be between 0 and 100
    rsi.forEach(value => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    });
  });

  it('should identify oversold condition', () => {
    const signal = interpretRSI(25);
    expect(signal.signal).toBe('oversold');
    expect(signal.value).toBe(25);
  });

  it('should identify overbought condition', () => {
    const signal = interpretRSI(75);
    expect(signal.signal).toBe('overbought');
    expect(signal.value).toBe(75);
  });

  it('should identify neutral condition', () => {
    const signal = interpretRSI(50);
    expect(signal.signal).toBe('neutral');
    expect(signal.value).toBe(50);
  });

  it('should handle null RSI value', () => {
    const signal = interpretRSI(null);
    expect(signal.signal).toBe('neutral');
    expect(signal.value).toBeNull();
  });

  it('should handle insufficient data', () => {
    const values = [100, 102, 101];
    const rsi = calculateRSI(values, 14);
    expect(rsi).toEqual([]);
  });

  it('should calculate latest RSI', () => {
    const values = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i) * 10);
    const latest = getLatestRSI(values, 14);
    expect(latest).not.toBeNull();
    if (latest !== null) {
      expect(latest).toBeGreaterThanOrEqual(0);
      expect(latest).toBeLessThanOrEqual(100);
    }
  });
});

describe('Edge Cases', () => {
  it('should handle empty arrays', () => {
    expect(calculateEMA([], 5)).toEqual([]);
    expect(calculateRSI([], 14)).toEqual([]);
  });

  it('should throw on invalid period', () => {
    expect(() => calculateEMA([1, 2, 3], 0)).toThrow();
    expect(() => calculateEMA([1, 2, 3], -1)).toThrow();
    expect(() => calculateRSI([1, 2, 3], 0)).toThrow();
  });
});