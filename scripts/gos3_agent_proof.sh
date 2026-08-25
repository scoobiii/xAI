#!/usr/bin/env bash
set -euo pipefail

# GOS3 behavioral onboarding proof. Read-only with respect to Git.
# It does not print credentials and never claims external connector access.
AGENT_ID="${1:-${GOS3_AGENT_ID:-unknown-agent}}"
FAIL=0
ok(){ printf '[GOS3][OK]   %s\n' "$*"; }
bad(){ printf '[GOS3][FAIL] %s\n' "$*"; FAIL=1; }

printf '%s\n' '============================================================'
printf '%s\n' 'GOS3 AGENT BEHAVIORAL CAPABILITY PROOF'
printf '%s\n' '============================================================'
printf 'agent_id=%s\n' "$AGENT_ID"

[[ -f docs/GOS3-AGENT-MANIFESTO.md ]] && ok 'manifest present' || bad 'manifest missing'
[[ -f scripts/gos3_agent_tooling_check.sh ]] && ok 'tooling audit present' || bad 'tooling audit missing'

# The proof is intentionally host/runtime-specific. We require a real Vortex sandbox
# implementation to be available; a shell-only simulation is not accepted.
SANDBOX_FILE="src/server/sandbox.ts"
if [[ -f "$SANDBOX_FILE" ]]; then
  ok "sandbox implementation present: $SANDBOX_FILE"
else
  bad "sandbox implementation missing: $SANDBOX_FILE"
fi

# Behavioral evidence: inspect the real implementation for the required execution/tool
# surfaces. This is only the repository gate; the host/runtime must additionally execute
# the probe and attach execution/evidence IDs before granting TOOLING_READY.
for symbol in 'executeJavaScript' 'executePythonSim' 'calculateEnergyBESS'; do
  if grep -q "${symbol}" "$SANDBOX_FILE" 2>/dev/null; then
    ok "required runtime/tool surface present: ${symbol}"
  else
    bad "required runtime/tool surface missing: ${symbol}"
  fi
done

# Prove the repository has a Node runtime capable of loading the sandbox source.
if command -v node >/dev/null 2>&1; then
  ok "node runtime available: $(node --version)"
else
  bad 'node runtime unavailable'
fi

# Never manufacture a success receipt. This command is a preflight contract check;
# host execution must supply GOS3_EXECUTION_ID and GOS3_EVIDENCE_ID after actual calls.
if [[ -n "${GOS3_EXECUTION_ID:-}" && -n "${GOS3_EVIDENCE_ID:-}" ]]; then
  ok 'host supplied execution/evidence IDs'
else
  bad 'no behavioral execution/evidence receipt supplied; TOOLING_READY cannot be claimed'
fi

if (( FAIL == 0 )); then
  ok "AGENT ${AGENT_ID} TOOLING_READY"
  exit 0
else
  bad "AGENT ${AGENT_ID} BLOCKED — no consequential capability may be granted"
  exit 1
fi
