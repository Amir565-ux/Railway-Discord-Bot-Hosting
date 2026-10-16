# syntax=docker/dockerfile:1
# Changed from node:20-bullseye to node:20-bookworm (Debian 12)
FROM node:20-bookworm

# Install Python, Ruby, and other tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    ruby-full \
    git \
    curl \
    wget \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r botgroup && useradd -r -g botgroup botuser

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy source code
COPY . .

# Create necessary directories and set permissions
RUN mkdir -p /app/uploads /app/bots && \
    chown -R botuser:botgroup /app

USER botuser

# Railway injects PORT
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/health || exit 1

CMD ["node", "src/index.js"]
