# Production Dockerfile for CryptoMate Discord Bot
# Multi-stage build for optimized image size and security

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy production dependencies for later
RUN cp -R node_modules /prod_node_modules

# Install all dependencies (including dev) for building
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy package files explicitly to ensure they're available
COPY package*.json ./

# Copy source code
COPY . .

# Debug: Verify environment and files
RUN echo "=== Build Environment Debug ===" && \
    echo "Current directory: $(pwd)" && \
    echo "PATH: $PATH" && \
    echo "Node version: $(node --version)" && \
    echo "NPM version: $(npm --version)" && \
    echo "Package.json exists: $(test -f package.json && echo 'YES' || echo 'NO')" && \
    echo "Contents of /app:" && \
    ls -la && \
    echo "package.json scripts:" && \
    cat package.json | grep -A 10 '"scripts"' || echo "No scripts found"

# Build TypeScript with explicit npm path
RUN /usr/local/bin/npm run build || \
    (echo "Build failed. Debugging info:" && \
     echo "NPM location: $(which npm)" && \
     echo "Node modules: $(test -d node_modules && echo 'EXISTS' || echo 'MISSING')" && \
     echo "TypeScript: $(test -f node_modules/.bin/tsc && echo 'EXISTS' || echo 'MISSING')" && \
     exit 1)

# Stage 3: Production
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY --from=dependencies /prod_node_modules ./node_modules

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy necessary configuration files
COPY package.json ./

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose health check port (optional)
# EXPOSE 8080

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the bot
CMD ["node", "dist/index.js"]

# Health check (optional - uncomment if you add health endpoint)
# HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
#   CMD node -e "require('http').get('http://localhost:8080/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });"

# Labels for metadata
LABEL name="cryptomate" \
      version="1.0.0" \
      description="Discord Trading Bot with AI Analysis" \
      maintainer="your-email@example.com"