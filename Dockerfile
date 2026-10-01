# =============================================================
# Stage 1 – Builder
# =============================================================
FROM node:24-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./

# Prefer a reproducible install; fall back and print npm logs if it fails
RUN npm ci --omit=dev --no-audit --no-fund \
  || (echo "===== npm debug log =====" && cat /root/.npm/_logs/*debug*.log && exit 1)

COPY src ./src

# =============================================================
# Stage 2 – Production
# =============================================================
FROM node:24-bookworm-slim AS production

RUN apt-get update \
  && apt-get install -y --no-install-recommends dumb-init wget \
  && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1001 nodejs \
  && useradd -r -u 1001 -g nodejs nodeapp

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
