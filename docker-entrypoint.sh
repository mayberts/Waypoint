#!/bin/sh
# Applies pending Prisma migrations then starts the server. Safe to run on
# every container start (no-op if the database is already up to date).
set -eu

echo ">> applying database migrations"
npx prisma migrate deploy

echo ">> starting server"
exec node_modules/.bin/next start -p "${PORT:-3000}"
