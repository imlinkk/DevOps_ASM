# =============================================================
# Stage 1 – Builder: install production dependencies
# =============================================================
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json .npmrc ./

# npm 11 (Node 24) matches the repo lockfile generated locally
RUN npm ci --omit=dev --no-audit --no-fund

COPY src ./src

# =============================================================
# Stage 2 – Production: slim final image
# =============================================================
FROM node:24-alpine AS production

RUN apk add --no-cache dumb-init wget

RUN addgroup -g 1001 -S nodejs && adduser -S nodeapp -u 1001 -G nodejs

WORKDIR /app

COPY --chown=nodeapp:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nodeapp:nodejs package.json ./
COPY --chown=nodeapp:nodejs src ./src

RUN mkdir -p logs && chown nodeapp:nodejs logs

USER nodeapp

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/health/live || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
