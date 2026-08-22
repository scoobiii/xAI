# ==========================================
# 🐳 MoltBot / zAI High-Performance Dockerfile
# Multi-Stage Lightweight Build (<150MB, Low-RAM Optimized)
# ==========================================

# --- STAGE 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy dependency manifests
COPY package.json package-lock.json* bun.lock* ./

# Install all dependencies for build
RUN npm install --frozen-lockfile || npm install

# Copy source tree
COPY . .

# Build Vite frontend & bundle Express server to dist/server.cjs
RUN npm run build

# Prune dev dependencies for lean runtime footprint
RUN npm prune --production

# --- STAGE 2: Lightweight Runtime Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

# Install curl for healthchecks and dumb-init for clean PID 1 signal forwarding
RUN apk add --no-cache curl dumb-init

# Runtime environment flags tuned for low-memory & Cloud Run / Termux / VPS
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS="--max-old-space-size=512 --max-semi-space-size=64 --no-warnings" \
    UV_THREADPOOL_SIZE=4

# Create data directory for atomic SQLite/WAL persistence
RUN mkdir -p /app/.data && chown -R node:node /app

# Copy production artifacts from builder
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist

# Run as non-privileged node user for security hardening
USER node

# Expose standard container port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Execute using dumb-init
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server.cjs"]
