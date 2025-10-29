# CryptoMate - Discord Trading AI Companion

A Discord bot that provides real-time cryptocurrency market analysis with technical indicators and AI-powered insights.

⚠️ **Disclaimer**: This bot provides technical analysis for educational purposes only. It does NOT provide financial advice. Always do your own research before making investment decisions.

## Features

- 📊 Real-time price data from Binance
- 📈 Technical indicators (EMA 20/50, RSI)
- 🎯 Support/Resistance level detection
- 🤖 AI-powered market summaries (Anthropic Claude or OpenAI)
- 💬 Slash commands and @mention support
- ⚡ Smart caching to reduce API calls
- 🛡️ Rate limiting for stability

## Prerequisites

- Node.js >= 20.0.0
- npm or yarn
- Discord Bot Token ([Create a Discord App](https://discord.com/developers/applications))
- Anthropic API Key or OpenAI API Key
- Binance API access (no key required for public data)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/cryptomate.git
cd cryptomate
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Discord Configuration (Required)
DISCORD_TOKEN=your_discord_bot_token
DISCORD_APP_ID=your_discord_app_id
DISCORD_PUBLIC_KEY=your_discord_public_key

# LLM Configuration (At least one required)
ANTHROPIC_API_KEY=your_anthropic_key  # For Claude
OPENAI_API_KEY=your_openai_key        # For GPT
LLM_PROVIDER=anthropic                # or 'openai'

# Optional Configuration
DEFAULT_TIMEFRAME=1h
CACHE_TTL_SECONDS=60
LOG_LEVEL=info
```

### 4. Build the project

```bash
npm run build
```

### 5. Register slash commands

```bash
npm run register
```

This needs to be run once to register the `/market` command globally.

## Usage

### Starting the bot

Development mode (with hot reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### Discord Commands

#### Slash Command
```
/market symbol:BTC timeframe:1h
```

Options:
- `symbol` (required): Cryptocurrency symbol (BTC, ETH, BTCUSDT, etc.)
- `timeframe` (optional): 1m, 5m, 15m, 30m, 1h, 4h, 1d (default: 1h)

#### Mention
```
@CryptoMate btc
@CryptoMate ETHUSDT
```

## Supported Symbols

The bot automatically normalizes common symbols:
- BTC, bitcoin → BTCUSDT
- ETH, ethereum → ETHUSDT
- SOL, solana → SOLUSDT
- And many more...

For other symbols, append USDT if not included.

## Technical Details

### Architecture

```
src/
├── discord/        # Discord bot logic
├── binance/        # Binance API integration
├── indicators/     # Technical indicator calculations
├── analysis/       # Market analysis and summarization
├── llm/           # AI service integrations
├── cache/         # In-memory caching
└── utils/         # Utilities and helpers
```

### Key Libraries

- **discord.js v14**: Discord bot framework
- **axios**: HTTP client for Binance API
- **@anthropic-ai/sdk**: Claude AI integration
- **openai**: GPT integration
- **zod**: Runtime type validation
- **pino**: Structured logging
- **vitest**: Testing framework

### Technical Indicators

- **EMA (Exponential Moving Average)**: 20 and 50 period crossover analysis
- **RSI (Relative Strength Index)**: 14 period with oversold/overbought detection
- **Support/Resistance**: Swing high/low detection with pivot points

## Testing

Run the test suite:
```bash
npm test
```

Run with coverage:
```bash
npm run test:run
```

## Deployment

### Railway

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Add environment variables in Railway dashboard
4. Deploy with these settings:
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`
   - Node Version: 20

### Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Configure:
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`
   - Environment: Node 20
4. Add environment variables in Render dashboard

### Docker (Optional)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## Monitoring

The bot includes structured logging with Pino. Monitor logs for:
- API errors
- Rate limit hits
- Cache performance
- Command usage

## Troubleshooting

### Bot not responding to commands
1. Check if bot is online in Discord
2. Verify bot has proper permissions in the server
3. Ensure slash commands are registered (`npm run register`)

### "Symbol not found" errors
- Verify the symbol exists on Binance
- Check symbol normalization in logs
- Try using full symbol format (e.g., BTCUSDT)

### Rate limiting
- Default cooldown is 5 seconds per user
- Cache TTL is 60 seconds
- Adjust in environment variables if needed

### LLM errors
- Verify API keys are correct
- Check API rate limits
- Bot will fallback to rule-based summaries if LLM fails

## Development

### Adding new commands
1. Create command in `src/discord/commands/`
2. Register in `src/index.ts`
3. Update command registration script
4. Run `npm run register`

### Adding new indicators
1. Create calculator in `src/indicators/`
2. Add tests in `test/`
3. Integrate in market analysis

### Modifying LLM prompts
Edit prompt generation in `src/analysis/summarize.ts`

## Assumptions

1. All cryptocurrency pairs are USDT-based
2. Binance public API is accessible without authentication
3. Default timeframe is 1h when not specified
4. Korean language for AI summaries (configurable)
5. 60-second cache TTL is sufficient for most use cases

## Docker Support

### Quick Start with Docker

The application includes complete Docker support with optimized images for both production and testing.

#### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- Make (optional, for convenience commands)

#### Production Deployment

1. **Build and run with Docker Compose:**
```bash
# Build production image
docker-compose -f docker-compose.prod.yml build

# Run in production
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

2. **Using Make commands (easier):**
```bash
make build        # Build production image
make run-prod     # Run production environment
make logs         # View logs
```

#### Development with Docker

1. **Run development environment with hot-reload:**
```bash
# Start development container
docker-compose up -d cryptomate-dev

# Or using Make
make run
make logs
```

2. **Run tests in Docker:**
```bash
# Run unit tests
docker-compose -f docker-compose.test.yml up

# Run all tests with quality checks
docker-compose -f docker-compose.test.yml --profile quality --profile security up

# Or using Make
make test        # Run basic tests
make test-all    # Run comprehensive tests
```

#### Docker Images

We provide two optimized Docker images:

1. **Production Image** (`Dockerfile`)
   - Multi-stage build for minimal size (~150MB)
   - Runs as non-root user for security
   - Uses Alpine Linux for small footprint
   - Includes signal handling with dumb-init
   - Production-optimized with only necessary dependencies

2. **Testing Image** (`Dockerfile.test`)
   - Includes all development dependencies
   - Built-in linting and code quality checks
   - Coverage report generation
   - Suitable for CI/CD pipelines

#### Docker Commands Reference

```bash
# Build images
docker build -t cryptomate:latest -f Dockerfile --target production .
docker build -t cryptomate:test -f Dockerfile.test .

# Run containers
docker run --env-file .env cryptomate:latest
docker run -v ./coverage:/app/coverage cryptomate:test

# Docker Compose operations
docker-compose up -d                    # Start development
docker-compose -f docker-compose.prod.yml up -d  # Start production
docker-compose -f docker-compose.test.yml up     # Run tests
docker-compose down                     # Stop all services
```

#### CI/CD Integration

For CI/CD pipelines, use the test image:

```yaml
# GitHub Actions example
- name: Run tests
  run: docker-compose -f docker-compose.test.yml up --exit-code-from test-runner

# GitLab CI example
test:
  script:
    - docker-compose -f docker-compose.test.yml up --exit-code-from test-runner
```

#### Performance Optimization

The production Docker image is optimized for:
- **Size**: ~150MB total (compared to ~1GB with all dependencies)
- **Security**: Non-root user, minimal attack surface
- **Caching**: Multi-stage build with layer optimization
- **Resources**: Limited to 512MB RAM and 1 CPU by default

#### Troubleshooting Docker

1. **Container won't start:**
   - Check logs: `docker-compose logs cryptomate`
   - Verify environment variables: `docker-compose config`

2. **Build fails:**
   - Clear cache: `docker builder prune`
   - Rebuild without cache: `docker-compose build --no-cache`

3. **Permission issues:**
   - Ensure files have correct permissions
   - The container runs as UID 1001 (nodejs user)

4. **Resource limits:**
   - Adjust in `docker-compose.prod.yml` under `deploy.resources`
   - Monitor usage: `docker stats cryptomate`

## Security

- API keys are never logged
- Environment variables are validated at startup
- Input sanitization for all user commands
- Rate limiting prevents abuse
- Docker containers run as non-root user
- Minimal attack surface with Alpine Linux

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run tests before committing
4. Submit a pull request

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.

---

**Remember**: This bot is for informational purposes only. Cryptocurrency trading carries significant risk. Never invest more than you can afford to lose.