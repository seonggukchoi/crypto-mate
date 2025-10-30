import { Message, EmbedBuilder } from 'discord.js';
import { createLogger } from '../logger.js';
import { parseSymbolFromMessage } from '../utils/symbol.js';
import { binance } from '../binance/rest.js';
import { calculateEMACrossover } from '../indicators/ema.js';
import { getLatestRSI, interpretRSI } from '../indicators/rsi.js';
import { calculateSupportResistance } from '../analysis/supportResistance.js';
import { MarketSummarizer } from '../analysis/summarize.js';
import { config } from '../config.js';

const logger = createLogger('mention-handler');

// Rate limiting
const userCooldowns = new Map<string, number>();
const COOLDOWN_MS = 5000; // 5 seconds

export async function handleMention(message: Message): Promise<void> {
  // Check if bot was mentioned
  if (!message.mentions.has(message.client.user!)) {
    return;
  }

  // Rate limiting
  const userId = message.author.id;
  const now = Date.now();
  const cooldownExpiry = userCooldowns.get(userId);

  if (cooldownExpiry && now < cooldownExpiry) {
    const remainingSeconds = Math.ceil((cooldownExpiry - now) / 1000);
    await message.reply(`⏱️ 잠시 기다려주세요. ${remainingSeconds}초 후에 다시 시도하세요.`);
    return;
  }

  userCooldowns.set(userId, now + COOLDOWN_MS);

  try {
    const symbol = parseSymbolFromMessage(message.content);

    if (!symbol) {
      await message.reply(
        '📊 사용법: `@CryptoMate BTC` 또는 `@CryptoMate ETHUSDT`\n' +
        '지원 심볼: BTC, ETH, BNB, SOL, ADA, XRP, DOGE, 등',
      );
      return;
    }

    // Show typing indicator
    if ('sendTyping' in message.channel) {
      await message.channel.sendTyping();
    }

    logger.info({ symbol, user: message.author.tag }, 'Processing mention');

    // Use default timeframe from config
    const timeframe = config.app.defaultTimeframe;

    // Fetch and analyze market data
    const marketData = await binance.getMarketData(symbol, timeframe);
    const closePrices = marketData.klines.map(k => parseFloat(k.close));
    const ema = calculateEMACrossover(closePrices);
    const rsiValue = getLatestRSI(closePrices, 14);
    const rsi = interpretRSI(rsiValue);
    const levels = calculateSupportResistance(marketData.klines);

    // Generate summary
    const summarizer = new MarketSummarizer();
    const summary = await summarizer.generateSummary({
      marketData,
      ema,
      rsi,
      levels,
      timeframe,
    });

    // Create and send embed
    const embed = createMentionEmbed(marketData, ema, rsi, levels, summary, timeframe);
    await message.reply({ embeds: [embed] });

  } catch (error) {
    logger.error({ error }, 'Failed to handle mention');

    let errorMessage = '❌ 처리 중 오류가 발생했습니다.';
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        errorMessage = '❌ 심볼을 찾을 수 없거나 API 오류가 발생했습니다.';
      }
    }

    await message.reply(errorMessage);
  } finally {
    // Clean up old cooldowns
    const cutoff = now - 60000; // 1 minute ago
    for (const [uid, expiry] of userCooldowns.entries()) {
      if (expiry < cutoff) {
        userCooldowns.delete(uid);
      }
    }
  }
}

function createMentionEmbed(
  marketData: any,
  ema: any,
  rsi: any,
  levels: any,
  summary: string,
  timeframe: string,
): EmbedBuilder {
  const changeEmoji = marketData.priceChangePercent24h >= 0 ? '📈' : '📉';
  const color = marketData.priceChangePercent24h >= 0 ? 0x00ff00 : 0xff0000;

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${(price / 1000).toFixed(2)}K`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B USDT`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M USDT`;
    return `${(volume / 1e3).toFixed(2)}K USDT`;
  };

  const embed = new EmbedBuilder()
    .setTitle(`${changeEmoji} ${marketData.symbol} Market Analysis`)
    .setColor(color)
    .setDescription(summary)
    .addFields(
      {
        name: '💰 Price',
        value: `${formatPrice(marketData.price)}\n${marketData.priceChangePercent24h.toFixed(2)}% (24h)`,
        inline: true,
      },
      {
        name: '📊 Volume',
        value: formatVolume(marketData.volume24h),
        inline: true,
      },
      {
        name: '📈 Indicators',
        value: `EMA: ${ema.trend}\nRSI: ${rsi.value?.toFixed(1) || 'N/A'} (${rsi.signal})`,
        inline: true,
      },
    );

  if (levels.support.length > 0 || levels.resistance.length > 0) {
    const supportStr = levels.support.length > 0
      ? levels.support.slice(0, 1).map((s: number) => formatPrice(s)).join('')
      : 'N/A';

    const resistanceStr = levels.resistance.length > 0
      ? levels.resistance.slice(0, 1).map((r: number) => formatPrice(r)).join('')
      : 'N/A';

    embed.addFields({
      name: '🎯 Key Levels',
      value: `S: ${supportStr} | R: ${resistanceStr}`,
      inline: false,
    });
  }

  embed
    .setTimestamp()
    .setFooter({
      text: `Binance • ${timeframe} • CryptoMate v1.0.0`,
    });

  return embed;
}