#!/bin/sh
set -e

echo "Running migrations..."
npx prisma migrate deploy || { echo "Migration failed"; exit 1; }

# Standalone output has no `next` CLI / npm scripts available at runtime —
# .next/standalone/server.js is the self-contained server entry point.
exec node server.js
