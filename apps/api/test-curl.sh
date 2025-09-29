#!/usr/bin/env bash
# Simple curl examples to test the local serverless API
# Usage: set SUPABASE_URL and SUPABASE_SERVICE_ROLE in env before running or use a .env loader

BASE_URL=${BASE_URL:-http://localhost:3000}
TOKEN=${TOKEN:-}

echo "Health check: ${BASE_URL}/api/"
curl -sS ${BASE_URL}/api/ | jq || true

if [ -n "$TOKEN" ]; then
  echo "\nTesting /auth/me (requires TOKEN env)"
  curl -sS -H "Authorization: Bearer ${TOKEN}" ${BASE_URL}/api/auth/me | jq || true

  echo "\nTesting /rpc/query for assessments (requires TOKEN)"
  curl -sS -X POST -H 'Content-Type: application/json' -H "Authorization: Bearer ${TOKEN}" \
    -d '{"table":"assessments","select":"id,title,created_at,status","filter":{"user_id":"'$USER_ID'"},"order":{"by":"created_at","direction":"desc"}}' \
    ${BASE_URL}/api/rpc/query | jq || true
else
  echo "\nTOKEN not set — skipping authenticated examples. Export TOKEN and rerun to test authenticated endpoints."
fi

echo "\nDone."
