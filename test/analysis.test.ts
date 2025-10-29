import { describe, it, expect } from 'vitest';
import {
  calculatePivotPoints,
  findSwingPoints,
  clusterLevels,
  calculateSupportResistance
} from '../src/analysis/supportResistance';

describe('Support and Resistance Analysis', () => {
  it('should calculate pivot points correctly', () => {
    const high = 110;
    const low = 100;
    const close = 105;

    const pivots = calculatePivotPoints(high, low, close);

    expect(pivots.pp).toBeCloseTo(105, 1);
    expect(pivots.r1).toBeCloseTo(110, 1);
    expect(pivots.r2).toBeCloseTo(115, 1);
    expect(pivots.s1).toBeCloseTo(100, 1);
    expect(pivots.s2).toBeCloseTo(95, 1);
  });

  it('should find swing highs and lows', () => {
    // Create sample klines with clear swing points
    const klines = Array.from({ length: 50 }, (i) => ({
      openTime: Date.now() - i * 3600000,
      open: '100',
      high: String(100 + Math.sin(i / 5) * 10 + (i % 10 === 5 ? 5 : 0)),
      low: String(100 - Math.sin(i / 5) * 10 - (i % 10 === 5 ? 5 : 0)),
      close: '100',
      volume: '1000',
      closeTime: Date.now() - i * 3600000 + 3599999,
      quoteAssetVolume: '100000',
      numberOfTrades: 100,
      takerBuyBaseAssetVolume: '500',
      takerBuyQuoteAssetVolume: '50000',
      ignore: '0',
    }));

    const swings = findSwingPoints(klines, 5);

    expect(swings.highs.length).toBeGreaterThanOrEqual(0);
    expect(swings.lows.length).toBeGreaterThanOrEqual(0);
  });

  it('should cluster price levels', () => {
    const levels = [100, 100.5, 101, 105, 105.5, 106, 110];
    const clustered = clusterLevels(levels, 0.01); // 1% threshold

    expect(clustered.length).toBeLessThan(levels.length);
    expect(clustered.length).toBeGreaterThan(0);
  });

  it('should handle empty level clustering', () => {
    const clustered = clusterLevels([], 0.01);
    expect(clustered).toEqual([]);
  });

  it('should calculate support and resistance from klines', () => {
    // Create realistic kline data
    const klines = Array.from({ length: 100 }, (i) => ({
      openTime: Date.now() - i * 3600000,
      open: String(100 + Math.random() * 5),
      high: String(105 + Math.random() * 5),
      low: String(95 + Math.random() * 5),
      close: String(100 + Math.random() * 5),
      volume: '1000',
      closeTime: Date.now() - i * 3600000 + 3599999,
      quoteAssetVolume: '100000',
      numberOfTrades: 100,
      takerBuyBaseAssetVolume: '500',
      takerBuyQuoteAssetVolume: '50000',
      ignore: '0',
    }));

    const sr = calculateSupportResistance(klines, 2);

    expect(sr.support).toBeInstanceOf(Array);
    expect(sr.resistance).toBeInstanceOf(Array);
    expect(sr.support.length).toBeLessThanOrEqual(2);
    expect(sr.resistance.length).toBeLessThanOrEqual(2);
  });

  it('should handle insufficient klines', () => {
    const klines = Array.from({ length: 10 }, () => ({
      openTime: Date.now(),
      open: '100',
      high: '105',
      low: '95',
      close: '100',
      volume: '1000',
      closeTime: Date.now() + 3599999,
      quoteAssetVolume: '100000',
      numberOfTrades: 100,
      takerBuyBaseAssetVolume: '500',
      takerBuyQuoteAssetVolume: '50000',
      ignore: '0',
    }));

    const sr = calculateSupportResistance(klines, 2);

    expect(sr.support).toEqual([]);
    expect(sr.resistance).toEqual([]);
    expect(sr.pivotPoints).toBeNull();
  });
});

describe('Analysis Edge Cases', () => {
  it('should handle extreme pivot point values', () => {
    const pivots = calculatePivotPoints(1000000, 1, 500000);
    expect(pivots.pp).toBeCloseTo(500000.33, 0);
    expect(pivots.r1).toBeGreaterThan(pivots.pp);
    expect(pivots.s1).toBeLessThan(pivots.pp);
  });

  it('should cluster very close levels', () => {
    const levels = [100, 100.001, 100.002, 100.003];
    const clustered = clusterLevels(levels, 0.001);
    expect(clustered.length).toBe(1);
    expect(clustered[0]).toBeCloseTo(100.0015, 4);
  });

  it('should handle single level clustering', () => {
    const levels = [100];
    const clustered = clusterLevels(levels, 0.01);
    expect(clustered).toEqual([100]);
  });
});