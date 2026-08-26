#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
CLI="$ROOT/scripts/gos3_traceability_cli.sh"
[[ -f "$CLI" ]] || { echo 'FAIL: traceability CLI missing'; exit 1; }

out="$(bash "$CLI")"

for needle in \
  'TRACEABILITY' \
  'GIT INVARIANTS' \
  'POLICY' \
  'CAPABILITIES' \
  'MCP' \
  'EVIDENCE' \
  'TRACEABILITY CHECK COMPLETE'; do
  grep -Fq "$needle" <<<"$out" || { echo "FAIL: missing section: $needle"; exit 1; }
done

# The CLI must not expose credential-looking environment values.
if grep -Eqi '(ghp_|github_pat_|ya29\.|AIza[0-9A-Za-z_-]{20,}|-----BEGIN .*PRIVATE KEY-----)' <<<"$out"; then
  echo 'FAIL: credential material detected in CLI output'
  exit 1
fi

echo 'PASS: GOS3 traceability CLI output contract'
