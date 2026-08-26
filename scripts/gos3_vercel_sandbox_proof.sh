#!/usr/bin/env bash
set -euo pipefail

# GOS3 Vercel Sandbox provider proof.
# This is a REAL provider probe when the host exposes the Vercel Sandbox CLI.
# It never prints credentials and never turns missing provider access into success.
AGENT_ID="${1:-${GOS3_AGENT_ID:-unknown-agent}}"
FAIL=0
ok(){ printf '[GOS3][OK]   %s\n' "$*"; }
bad(){ printf '[GOS3][FAIL] %s\n' "$*"; FAIL=1; }

printf '%s\n' '============================================================'
printf '%s\n' 'GOS3 VERCEL SANDBOX PROVIDER PROOF'
printf '%s\n' '============================================================'
printf 'agent_id=%s\n' "$AGENT_ID"

if ! command -v sandbox >/dev/null 2>&1; then
  bad 'Vercel Sandbox CLI unavailable; no provider execution may be claimed'
  exit 1
fi

if [[ -z "${VERCEL_OIDC_TOKEN:-}" && -z "${VERCEL_TOKEN:-}" ]]; then
  bad 'Vercel authentication unavailable; set VERCEL_OIDC_TOKEN or VERCEL_TOKEN through the host, never in source'
  exit 1
fi

# Keep the probe deterministic and harmless. The sandbox CLI owns creation/isolation.
# We pass command and arguments separately through the CLI boundary; no shell input is
# accepted from the agent under test.
START_MS="$(date +%s%3N)"
EXECUTION_ID="$(cat /proc/sys/kernel/random/uuid 2>/dev/null || python3 -c 'import uuid; print(uuid.uuid4())')"
TMP_OUT="$(mktemp)"
TMP_ERR="$(mktemp)"
trap 'rm -f "$TMP_OUT" "$TMP_ERR"' EXIT

set +e
sandbox run --timeout 2m -- node -e 'process.stdout.write("GOS3_VERCEL_SANDBOX_OK\\n")' >"$TMP_OUT" 2>"$TMP_ERR"
EXIT_CODE=$?
set -e
END_MS="$(date +%s%3N)"
DURATION_MS=$((END_MS - START_MS))

STDOUT="$(cat "$TMP_OUT")"
STDERR="$(cat "$TMP_ERR")"

if (( EXIT_CODE != 0 )); then
  bad "Vercel Sandbox execution failed (exit_code=${EXIT_CODE})"
  exit 1
fi

if ! grep -Fq 'GOS3_VERCEL_SANDBOX_OK' "$TMP_OUT"; then
  bad 'Vercel Sandbox returned without deterministic proof marker'
  exit 1
fi

# Receipt is derived from actual command output, error output, exit code and duration.
EVIDENCE_ID="0x$(printf '%s' "${STDOUT}\n${STDERR}\n${EXIT_CODE}\n${DURATION_MS}" | sha256sum | awk '{print $1}')"

ok 'Vercel Sandbox command executed successfully'
ok "provider=vercel-sandbox"
ok "execution_id=${EXECUTION_ID}"
ok "evidence_id=${EVIDENCE_ID}"
ok "duration_ms=${DURATION_MS}"
printf 'GOS3_EXECUTION_ID=%s\n' "$EXECUTION_ID"
printf 'GOS3_EVIDENCE_ID=%s\n' "$EVIDENCE_ID"
ok "AGENT ${AGENT_ID} VERCEL_SANDBOX_READY"
