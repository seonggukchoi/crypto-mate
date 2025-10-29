import { describe, it, expect } from 'vitest';
import { normalizeSymbol, parseSymbolFromMessage } from '../src/utils/symbol';

describe('Symbol Normalization', () => {
  it('should normalize common crypto symbols', () => {
    expect(normalizeSymbol('btc')).toBe('BTCUSDT');
    expect(normalizeSymbol('BTC')).toBe('BTCUSDT');
    expect(normalizeSymbol('bitcoin')).toBe('BTCUSDT');
    expect(normalizeSymbol('eth')).toBe('ETHUSDT');
    expect(normalizeSymbol('ethereum')).toBe('ETHUSDT');
    expect(normalizeSymbol('sol')).toBe('SOLUSDT');
    expect(normalizeSymbol('solana')).toBe('SOLUSDT');
  });

  it('should handle already normalized symbols', () => {
    expect(normalizeSymbol('BTCUSDT')).toBe('BTCUSDT');
    expect(normalizeSymbol('ETHUSDT')).toBe('ETHUSDT');
    expect(normalizeSymbol('btcusdt')).toBe('BTCUSDT');
  });

  it('should append USDT to unknown symbols', () => {
    expect(normalizeSymbol('RANDOM')).toBe('RANDOMUSDT');
    expect(normalizeSymbol('xyz')).toBe('XYZUSDT');
  });

  it('should handle edge cases', () => {
    expect(normalizeSymbol(' BTC ')).toBe('BTCUSDT');
    expect(normalizeSymbol('  eth  ')).toBe('ETHUSDT');
  });

  it('should throw on empty input', () => {
    expect(() => normalizeSymbol('')).toThrow();
    expect(() => normalizeSymbol('   ')).toThrow();
  });

  it('should handle various altcoins', () => {
    expect(normalizeSymbol('doge')).toBe('DOGEUSDT');
    expect(normalizeSymbol('ada')).toBe('ADAUSDT');
    expect(normalizeSymbol('xrp')).toBe('XRPUSDT');
    expect(normalizeSymbol('matic')).toBe('MATICUSDT');
    expect(normalizeSymbol('link')).toBe('LINKUSDT');
  });
});

describe('Parse Symbol from Message', () => {
  it('should parse symbol from Discord mention', () => {
    expect(parseSymbolFromMessage('<@!123456789> btc')).toBe('BTCUSDT');
    expect(parseSymbolFromMessage('<@123456789> eth')).toBe('ETHUSDT');
    expect(parseSymbolFromMessage('<@!987654321> BTCUSDT')).toBe('BTCUSDT');
  });

  it('should parse first valid symbol', () => {
    expect(parseSymbolFromMessage('check btc price')).toBe('BTCUSDT');
    expect(parseSymbolFromMessage('what about eth today')).toBe('ETHUSDT');
  });

  it('should return null for invalid input', () => {
    expect(parseSymbolFromMessage('')).toBeNull();
    expect(parseSymbolFromMessage('<@!123456789>')).toBeNull();
    expect(parseSymbolFromMessage('hello world')).toBeNull();
  });

  it('should handle complex messages', () => {
    expect(parseSymbolFromMessage('<@!123> show me btc analysis')).toBe('BTCUSDT');
    expect(parseSymbolFromMessage('  <@123>   sol  please  ')).toBe('SOLUSDT');
  });

  it('should handle multiple mentions', () => {
    expect(parseSymbolFromMessage('<@!123> <@!456> btc')).toBe('BTCUSDT');
  });
});