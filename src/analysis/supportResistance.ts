import type { Kline } from '../binance/types.js';

export interface PivotPoints {
  pp: number;  // Pivot Point
  r1: number;  // Resistance 1
  r2: number;  // Resistance 2
  s1: number;  // Support 1
  s2: number;  // Support 2
}

export interface SupportResistance {
  support: number[];
  resistance: number[];
  pivotPoints: PivotPoints | null;
}

/**
 * Calculate pivot points from the last complete candle
 * Note: technicalindicators library doesn't provide pivot points, keeping custom implementation
 */
export function calculatePivotPoints(high: number, low: number, close: number): PivotPoints {
  const pp = (high + low + close) / 3;
  const r1 = 2 * pp - low;
  const r2 = pp + (high - low);
  const s1 = 2 * pp - high;
  const s2 = pp - (high - low);

  return { pp, r1, r2, s1, s2 };
}

/**
 * Find swing highs and lows in price data
 */
export function findSwingPoints(
  klines: Kline[],
  lookback: number = 10,
): { highs: number[]; lows: number[] } {
  const highs: number[] = [];
  const lows: number[] = [];

  for (let i = lookback; i < klines.length - lookback; i++) {
    const currentHigh = parseFloat(klines[i]!.high);
    const currentLow = parseFloat(klines[i]!.low);

    let isSwingHigh = true;
    let isSwingLow = true;

    // Check if it's a swing high
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i) {
        if (parseFloat(klines[j]!.high) >= currentHigh) {
          isSwingHigh = false;
          break;
        }
      }
    }

    // Check if it's a swing low
    for (let j = i - lookback; j <= i + lookback; j++) {
      if (j !== i) {
        if (parseFloat(klines[j]!.low) <= currentLow) {
          isSwingLow = false;
          break;
        }
      }
    }

    if (isSwingHigh) highs.push(currentHigh);
    if (isSwingLow) lows.push(currentLow);
  }

  return { highs, lows };
}

/**
 * Cluster nearby price levels to identify significant support/resistance zones
 */
export function clusterLevels(levels: number[], threshold: number = 0.005): number[] {
  if (levels.length === 0) return [];

  const sorted = [...levels].sort((a, b) => a - b);
  const clusters: number[][] = [];
  let currentCluster: number[] = [sorted[0]!];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]!;
    const lastInCluster = currentCluster[currentCluster.length - 1]!;

    if ((current - lastInCluster) / lastInCluster <= threshold) {
      currentCluster.push(current);
    } else {
      clusters.push(currentCluster);
      currentCluster = [current];
    }
  }

  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Return the average of each cluster, sorted by cluster size (significance)
  return clusters
    .sort((a, b) => b.length - a.length)
    .map((cluster) => cluster.reduce((sum, val) => sum + val, 0) / cluster.length);
}

/**
 * Calculate support and resistance levels from kline data
 */
export function calculateSupportResistance(
  klines: Kline[],
  maxLevels: number = 2,
): SupportResistance {
  if (klines.length < 50) {
    return {
      support: [],
      resistance: [],
      pivotPoints: null,
    };
  }

  // Get the last complete candle for pivot points
  const lastCandle = klines[klines.length - 2];
  let pivotPoints: PivotPoints | null = null;

  if (lastCandle) {
    pivotPoints = calculatePivotPoints(
      parseFloat(lastCandle.high),
      parseFloat(lastCandle.low),
      parseFloat(lastCandle.close),
    );
  }

  // Find swing points
  const swings = findSwingPoints(klines.slice(-100)); // Use last 100 candles

  // Cluster the levels
  const resistanceLevels = clusterLevels(swings.highs, 0.01);
  const supportLevels = clusterLevels(swings.lows, 0.01);

  // Get current price
  const currentPrice = parseFloat(klines[klines.length - 1]!.close);

  // Filter and limit levels
  const support = supportLevels
    .filter((level) => level < currentPrice)
    .slice(0, maxLevels);

  const resistance = resistanceLevels
    .filter((level) => level > currentPrice)
    .slice(0, maxLevels);

  // Add pivot point levels if they're not already covered
  if (pivotPoints) {
    if (support.length < maxLevels && pivotPoints.s1 < currentPrice) {
      support.push(pivotPoints.s1);
    }
    if (resistance.length < maxLevels && pivotPoints.r1 > currentPrice) {
      resistance.push(pivotPoints.r1);
    }
  }

  return {
    support: support.sort((a, b) => b - a), // Descending order (closest first)
    resistance: resistance.sort((a, b) => a - b), // Ascending order (closest first)
    pivotPoints,
  };
}