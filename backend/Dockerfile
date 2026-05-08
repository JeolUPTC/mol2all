# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-slim
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY --from=builder /app/prisma       ./prisma
COPY                package.json      ./

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && echo '=== Prisma OK - iniciando NestJS ===' && node dist/main"]
