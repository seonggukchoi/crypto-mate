/**
 * Symbol normalization utilities for converting various input formats
 * to standard Binance symbol format (e.g., BTCUSDT)
 */

const COMMON_SYMBOLS: Record<string, string> = {
  'btc': 'BTCUSDT',
  'bitcoin': 'BTCUSDT',
  'eth': 'ETHUSDT',
  'ethereum': 'ETHUSDT',
  'bnb': 'BNBUSDT',
  'sol': 'SOLUSDT',
  'solana': 'SOLUSDT',
  'ada': 'ADAUSDT',
  'cardano': 'ADAUSDT',
  'xrp': 'XRPUSDT',
  'ripple': 'XRPUSDT',
  'doge': 'DOGEUSDT',
  'dogecoin': 'DOGEUSDT',
  'avax': 'AVAXUSDT',
  'avalanche': 'AVAXUSDT',
  'dot': 'DOTUSDT',
  'polkadot': 'DOTUSDT',
  'matic': 'MATICUSDT',
  'polygon': 'MATICUSDT',
  'link': 'LINKUSDT',
  'chainlink': 'LINKUSDT',
  'atom': 'ATOMUSDT',
  'cosmos': 'ATOMUSDT',
  'ltc': 'LTCUSDT',
  'litecoin': 'LTCUSDT',
  'uni': 'UNIUSDT',
  'uniswap': 'UNIUSDT',
  'algo': 'ALGOUSDT',
  'algorand': 'ALGOUSDT',
  'near': 'NEARUSDT',
  'ftm': 'FTMUSDT',
  'fantom': 'FTMUSDT',
  'sand': 'SANDUSDT',
  'sandbox': 'SANDUSDT',
  'mana': 'MANAUSDT',
  'decentraland': 'MANAUSDT',
  'axs': 'AXSUSDT',
  'axie': 'AXSUSDT',
  'gala': 'GALAUSDT',
  'enj': 'ENJUSDT',
  'enjin': 'ENJUSDT',
};

export function normalizeSymbol(input: string): string {
  if (!input) {
    throw new Error('Symbol input is required');
  }

  // Clean and uppercase the input
  const cleaned = input.trim().toUpperCase();

  // Check if it's already in the correct format (ends with USDT)
  if (cleaned.endsWith('USDT')) {
    return cleaned;
  }

  // Check if it's a common symbol or name
  const lowerInput = input.trim().toLowerCase();
  if (COMMON_SYMBOLS[lowerInput]) {
    return COMMON_SYMBOLS[lowerInput];
  }

  // If it doesn't end with USDT, append it
  if (!cleaned.includes('USDT')) {
    return `${cleaned}USDT`;
  }

  return cleaned;
}

export function parseSymbolFromMessage(message: string): string | null {
  // Remove mentions and extra spaces
  const cleaned = message
    .replace(/<@!\d+>/g, '') // Remove Discord mentions
    .replace(/<@\d+>/g, '')  // Remove Discord mentions without !
    .trim();

  // Split by spaces and find the first valid token
  const tokens = cleaned.split(/\s+/);

  for (const token of tokens) {
    if (token.length > 0) {
      try {
        return normalizeSymbol(token);
      } catch {
        // Continue to next token if normalization fails
      }
    }
  }

  return null;
}