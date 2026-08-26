#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
PROOF="$ROOT/scripts/gos3_vercel_sandbox_proof.sh"

[[ -f "$PROOF" ]] || { echo 'FAIL: Vercel Sandbox proof missing'; exit 1; }
grep -Fq 'sandbox run' "$PROOF" || { echo 'FAIL: real Vercel Sandbox execution missing'; exit 1; }
grep -Fq 'VERCEL_OIDC_TOKEN' "$PROOF" || { echo 'FAIL: Vercel OIDC authentication path missing'; exit 1; }
grep -Fq 'VERCEL_TOKEN' "$PROOF" || { echo 'FAIL: Vercel token authentication path missing'; exit 1; }
grep -Fq 'GOS3_EXECUTION_ID' "$PROOF" || { echo 'FAIL: execution receipt missing'; exit 1; }
grep -Fq 'GOS3_EVIDENCE_ID' "$PROOF" || { echo 'FAIL: evidence receipt missing'; exit 1; }
grep -Fq 'exit_code' "$PROOF" || { echo 'FAIL: exit code not part of failure/evidence path'; exit 1; }
grep -Fq 'sha256sum' "$PROOF" || { echo 'FAIL: evidence hash derivation missing'; exit 1; }

# Static contract only: if the provider is not installed/authenticated in this host,
# the behavioral provider test MUST fail closed rather than pretending to have run.
if command -v sandbox >/dev/null 2>&1 && [[ -n "${VERCEL_OIDC_TOKEN:-}" || -n "${VERCEL_TOKEN:-}" ]]; then
  GOS3_AGENT_ID="test-vercel-provider" "$PROOF" test-vercel-provider
else
  set +e
  OUTPUT="$(GOS3_AGENT_ID=test-vercel-provider "$PROOF" test-vercel-provider 2>&1)"
  STATUS=$?
  set -e
  [[ $STATUS -ne 0 ]] || { echo 'FAIL: missing provider/auth unexpectedly passed'; exit 1; }
  printf '%s\n' "$OUTPUT" | grep -Eq '\[GOS3\]\[FAIL\].*(Sandbox CLI unavailable|authentication unavailable)' || {
    echo 'FAIL: provider absence did not fail closed with an explicit reason'; exit 1;
  }
fi

echo 'PASS: GOS3 Vercel Sandbox provider contract'
