#!/bin/sh
set -e

echo "=== MOL2ALL Backend Startup ==="
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"
echo "DATABASE_URL set: $([ -n "$DATABASE_URL" ] && echo yes || echo NO)"

echo "--- Running Prisma migrate deploy ---"
npx prisma migrate deploy

echo "--- Starting NestJS server ---"
node -r tsconfig-paths/register dist/main
