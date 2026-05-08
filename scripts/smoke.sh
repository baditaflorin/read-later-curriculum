#!/usr/bin/env bash
set -euo pipefail

npm run build
node scripts/check-pages-build.mjs
node scripts/static-server.mjs docs 4173 > /tmp/read-later-curriculum-smoke.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT

for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:4173/read-later-curriculum/ >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done

npx playwright test --config playwright.config.ts
