import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  Colors,
} from 'discord.js';
import { z } from 'zod';
import { createLogger } from '../../logger.js';
import { normalizeSymbol } from '../../utils/symbol.js';
import { binance } from '../../binance/rest.js';
import { calculateEMACrossover } from '../../indicators/ema.js';
import { getLatestRSI, interpretRSI } from '../../indicators/rsi.js';
import { calculateSupportResistance } from '../../analysis/supportResistance.js';
import { MarketSummarizer } from '../../analysis/summarize.js';

const logger = createLogger('market-command');

const timeframeSchema = z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '1d']).default('1h');

export const marketCommand = new SlashCommandBuilder()
  .setName('market')
  .setDescription('Get market analysis for a cryptocurrency')
  .addStringOption((option) =>
    option
      .setName('symbol')
      .setDescription('Cryptocurrency symbol (e.g., BTC, ETH, BTCUSDT)')
      .setRequired(true),
  )
  .addStringOption((option) =>
    option
      .setName('timeframe')
      .setDescription('Timeframe for analysis')
      .addChoices(
        { name: '1 minute', value: '1m' },
        { name: '5 minutes', value: '5m' },
        { name: '15 minutes', value: '15m' },
        { name: '30 minutes', value: '30m' },
        { name: '1 hour', value: '1h' },
        { name: '4 hours', value: '4h' },
        { name: '1 day', value: '1d' },
      )
      .setRequired(false),
  );

export async function handleMarketCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();

  try {
    const symbolInput = interaction.options.getString('symbol', true);
    const timeframeInput = interaction.options.getString('timeframe') || '1h';

    const symbol = normalizeSymbol(symbolInput);
    const timeframe = timeframeSchema.parse(timeframeInput);

    logger.info({ symbol, timeframe, user: interaction.user.tag }, 'Processing market command');

    // Fetch market data
    const marketData = await binance.getMarketData(symbol, timeframe);

    // Calculate indicators
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

    // Create embed
    const embed = createMarketEmbed(marketData, ema, rsi, levels, summary, timeframe);

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    logger.error({ error }, 'Failed to process market command');

    let errorMessage = '❌ 처리 중 오류가 발생했습니다.';
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        errorMessage = '❌ 심볼을 찾을 수 없거나 Binance API 오류가 발생했습니다.';
      }
    }

    await interaction.editReply({
      content: errorMessage,
      embeds: [],
    });
  }
}

function createMarketEmbed(
  marketData: any,
  ema: any,
  rsi: any,
  levels: any,
  summary: string,
  timeframe: string,
): EmbedBuilder {
  const changeEmoji = marketData.priceChangePercent24h >= 0 ? '📈' : '📉';
  const color = marketData.priceChangePercent24h >= 0 ? Colors.Green : Colors.Red;

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
    .setTitle(`${changeEmoji} ${marketData.symbol} Market Overview`)
    .setColor(color)
    .setDescription(summary)
    .addFields(
      {
        name: '📊 Price Info',
        value: `**Current:** ${formatPrice(marketData.price)}
**24h Change:** ${marketData.priceChangePercent24h.toFixed(2)}% (${formatPrice(marketData.priceChange24h)})
**24h Volume:** ${formatVolume(marketData.volume24h)}`,
        inline: true,
      },
      {
        name: '📈 Moving Averages',
        value: `**EMA 20:** ${ema.ema20 ? formatPrice(ema.ema20) : 'N/A'}
**EMA 50:** ${ema.ema50 ? formatPrice(ema.ema50) : 'N/A'}
**Trend:** ${ema.trend.charAt(0).toUpperCase() + ema.trend.slice(1)}`,
        inline: true,
      },
      {
        name: '🎯 RSI',
        value: `**Value:** ${rsi.value?.toFixed(1) || 'N/A'}
**Signal:** ${rsi.signal.charAt(0).toUpperCase() + rsi.signal.slice(1)}`,
        inline: true,
      },
    );

  if (levels.support.length > 0 || levels.resistance.length > 0) {
    const supportStr = levels.support.length > 0
      ? levels.support.map((s: number) => formatPrice(s)).join(', ')
      : 'No clear levels';

    const resistanceStr = levels.resistance.length > 0
      ? levels.resistance.map((r: number) => formatPrice(r)).join(', ')
      : 'No clear levels';

    embed.addFields({
      name: '🎯 Key Levels',
      value: `**Support:** ${supportStr}
**Resistance:** ${resistanceStr}`,
      inline: false,
    });
  }

  embed
    .setTimestamp()
    .setFooter({
      text: `Data: Binance • Timeframe: ${timeframe} • CryptoMate v1.0.0`,
    });

  return embed;
}