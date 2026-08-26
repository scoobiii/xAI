#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
CONNECTORS="$ROOT/src/services/connectorsService.ts"
MCP_TS="$ROOT/src/server/mcpService.ts"
SERVER="$ROOT/server.ts"

[[ -f "$CONNECTORS" ]] || { echo 'FAIL: connector catalog missing'; exit 1; }

# A catalog is metadata, not host proof. Authenticated/external capabilities must
# never be represented as connected merely because the UI object says so.
if grep -nE '^[[:space:]]*isConnected:[[:space:]]*true' "$CONNECTORS" >/tmp/gos3-connected-claims.txt; then
  echo 'FAIL: connector catalog contains declarative isConnected=true claims without host evidence'
  cat /tmp/gos3-connected-claims.txt
  rm -f /tmp/gos3-connected-claims.txt
  exit 1
fi
rm -f /tmp/gos3-connected-claims.txt

# These were claimed by prior agent reports but are not part of the verified repo
# contract. If implemented later, this test must be updated with behavioral proof.
[[ ! -f "$MCP_TS" ]] || { echo 'FAIL: mcpService.ts exists; add behavioral MCP evidence before declaring it operational'; exit 1; }

for needle in \
  'github_get_repo' \
  'gcloud_project_info' \
  'gcloud_list_gemini_models' \
  'gcloud_storage_status' \
  '/api/mcp/' \
  '/api/connectors/config'; do
  if grep -R -nF --exclude='*.md' --exclude='*.map' "$needle" "$ROOT/src" "$ROOT/server.ts" 2>/dev/null; then
    echo "FAIL: undeclared claimed connector surface found: $needle"
    exit 1
  fi
done

# A hardcoded connected timestamp/account is also not proof of a live connector.
if grep -nE '^[[:space:]]*(accountEmail|connectedAt):' "$CONNECTORS" >/tmp/gos3-connector-meta.txt; then
  echo 'FAIL: connector catalog contains hardcoded connection identity/timestamps'
  cat /tmp/gos3-connector-meta.txt
  rm -f /tmp/gos3-connector-meta.txt
  exit 1
fi
rm -f /tmp/gos3-connector-meta.txt

echo 'PASS: GOS3 connector claim anti-fabrication contract'
