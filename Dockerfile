# syntax=docker/dockerfile:1
# ============================================
# BUILD STAGE
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source code
COPY . .

# ============================================
# RUNTIME STAGE
# ============================================
FROM node:20-alpine AS runtime

# Create non-root user for security
RUN addgroup -S botgroup && adduser -S botuser -G botgroup

WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder --chown=botuser:botgroup /app/node_modules ./node_modules
COPY --from=builder --chown=botuser:botgroup /app/src ./src
COPY --from=builder --chown=botuser:botgroup /app/package.json ./

# Switch to non-root user
USER botuser

# Railway injects PORT env var
EXPOSE 3000

# Health check endpoint for Railway liveness monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/health || exit 1

CMD ["node", "src/index.js"]
