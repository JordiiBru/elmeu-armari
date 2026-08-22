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

# Installs the `prisma` CLI in isolation, in its own empty package.json —
# not the app's, which declares next/react/sharp/etc. in "dependencies".
# npm install reconciles against whatever package.json is in scope, so
# running it in a dir that already has the full app manifest replaced the
# standalone-tracer-trimmed node_modules/next (small) with the complete
# `next` package (189MB) plus devDependencies-adjacent transitive weight.
FROM node:20-alpine AS prisma-cli
WORKDIR /prisma-cli
RUN echo '{}' > package.json && npm install prisma@7.8.0 dotenv@^17.4.2 --omit=dev

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
# drops the `prisma` CLI even though docker-entrypoint.sh needs it to run
# `prisma migrate deploy` on boot. The CLI's own package.json declares ~70
# transitive deps (studio-core, mysql2, postgres, pglite, ...) for
# subcommands we never use against sqlite — hand-copying individual
# node_modules/<pkg> folders proved fragile (missed `effect`, then broke
# node_modules/.bin/prisma's symlink-relative .wasm lookups when COPY
# dereferenced it). The prisma-cli stage resolves the real tree via npm.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=prisma-cli /prisma-cli/node_modules ./node_modules

# There is no HTTP route that creates a login, so the admin needs this
# one script inside the running container:
#   docker exec -it <container> node scripts/create-user.mjs --username <name>
# It talks to SQLite and Argon2 directly, both of which the standalone
# trace already put in ./node_modules.
COPY --from=builder /app/scripts ./scripts

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:/data/prod.db

ENTRYPOINT ["/docker-entrypoint.sh"]
