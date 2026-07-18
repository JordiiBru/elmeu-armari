FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npx prisma generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN DATABASE_URL=file:/tmp/build.db npx prisma migrate deploy && \
    DATABASE_URL=file:/tmp/build.db npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /data && chown nextjs:nodejs /data

# `output: "standalone"` (next.config.ts) already traces the minimal
# node_modules subset the server needs (next, react, sharp, better-sqlite3
# native binding, @prisma/client, the generated client under src/generated).
# We copy only that trimmed tree instead of the full builder node_modules,
# which also drags in devDependencies (eslint, playwright, tailwind, vitest, ...).
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Standalone tracing only follows what the running server imports, so it
# drops the `prisma` CLI (+ its `@prisma/*` engine packages and `dotenv`,
# read by prisma.config.ts) even though it's a runtime dependency here —
# docker-entrypoint.sh needs it to run `prisma migrate deploy` on boot.
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/dotenv ./node_modules/dotenv
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:/data/prod.db

ENTRYPOINT ["/docker-entrypoint.sh"]
