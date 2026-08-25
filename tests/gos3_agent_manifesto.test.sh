#!/usr/bin/env bash
set -euo pipefail

fail(){ echo "FAIL: $*" >&2; exit 1; }
ok(){ echo "PASS: $*"; }

[[ -f docs/GOS3-AGENT-MANIFESTO.md ]] || fail 'manifest missing'
[[ -f scripts/gos3_agent_proof.sh ]] || fail 'agent proof missing'
[[ -f src/server/sandbox.ts ]] || fail 'sandbox implementation missing'

grep -q 'No proof → no capability → no consequential action' docs/GOS3-AGENT-MANIFESTO.md || fail 'fail-closed rule missing'
grep -q 'executeJavaScript' docs/GOS3-AGENT-MANIFESTO.md || fail 'JS proof requirement missing'
grep -q 'executePythonSim' docs/GOS3-AGENT-MANIFESTO.md || fail 'Python proof requirement missing'
grep -q 'calculateEnergyBESS' docs/GOS3-AGENT-MANIFESTO.md || fail 'tool proof requirement missing'
grep -q 'git rebase origin/<target-branch>' docs/GOS3-AGENT-MANIFESTO.md || fail 'Git concurrency protocol missing'
grep -q 'GOS3_EXECUTION_ID' scripts/gos3_agent_proof.sh || fail 'execution receipt gate missing'
grep -q 'GOS3_EVIDENCE_ID' scripts/gos3_agent_proof.sh || fail 'evidence receipt gate missing'

# Must fail closed when no behavioral receipt is supplied.
if GOS3_EXECUTION_ID='' GOS3_EVIDENCE_ID='' bash scripts/gos3_agent_proof.sh test-agent >/tmp/gos3-proof.out 2>&1; then
  cat /tmp/gos3-proof.out
  fail 'proof accepted without execution/evidence receipt'
fi

grep -q 'BLOCKED' /tmp/gos3-proof.out || fail 'missing BLOCKED result'
ok 'GOS3 Agent Manifesto onboarding contract'
