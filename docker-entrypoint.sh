#!/bin/sh
set -e

echo "Running migrations..."
# Not `npx prisma`: node_modules/.bin/prisma is a symlink in the builder
# image and gets dereferenced by `COPY`, which breaks its relative lookup
# of sibling .wasm files under prisma/build/ (see Dockerfile). Invoke the
# package entrypoint directly instead.
node node_modules/prisma/build/index.js migrate deploy || { echo "Migration failed"; exit 1; }

# Standalone output has no `next` CLI / npm scripts available at runtime —
# .next/standalone/server.js is the self-contained server entry point.
exec node server.js
