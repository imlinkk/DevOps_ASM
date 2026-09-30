# =============================================================
# Stage 1 – Builder: install ALL deps (including devDeps)
# =============================================================
FROM node:20-alpine AS builder

# Install build tools for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy manifests first to leverage layer caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy source files
COPY src ./src

# =============================================================
# Stage 2 – Production: slim final image
# =============================================================
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001 -G nodejs

WORKDIR /app

# Copy only production node_modules from builder
COPY --chown=nodeapp:nodejs --from=builder /app/node_modules ./node_modules

# Copy source files with correct ownership
COPY --chown=nodeapp:nodejs package*.json ./
COPY --chown=nodeapp:nodejs src ./src

# Create logs directory with correct permissions
RUN mkdir -p logs && chown nodeapp:nodejs logs

# Switch to non-root user
USER nodeapp

# Expose application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health/live || exit 1

# Use dumb-init to handle PID 1 signals correctly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
