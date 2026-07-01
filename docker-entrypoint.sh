#!/bin/sh
set -e

echo "Running migrations..."
npx prisma migrate deploy || { echo "Migration failed"; exit 1; }

exec npm start
