#!/usr/bin/env bash
set -euo pipefail

fail(){ echo "FAIL: $*" >&2; exit 1; }
ok(){ echo "PASS: $*"; }

[[ -f docs/GOS3-AGENT-MANIFESTO.md ]] || fail 'manifest missing'
[[ -f scripts/gos3_agent_proof.sh ]] || fail 'agent proof missing'
[[ -f scripts/gos3_git_admit.sh ]] || fail 'admission gate missing'
[[ -f tests/gos3_git_admit.test.sh ]] || fail 'admission contract test missing'
[[ -f tests/gos3_agent_runtime.test.ts ]] || fail 'behavioral runtime test missing'
[[ -f src/server/sandbox.ts ]] || fail 'sandbox implementation missing'

grep -q 'No proof → no capability → no consequential action' docs/GOS3-AGENT-MANIFESTO.md || fail 'fail-closed rule missing'
grep -q 'executeJavaScript' docs/GOS3-AGENT-MANIFESTO.md || fail 'JS proof requirement missing'
grep -q 'executePythonSim' docs/GOS3-AGENT-MANIFESTO.md || fail 'Python proof requirement missing'
grep -q 'calculateEnergyBESS' docs/GOS3-AGENT-MANIFESTO.md || fail 'tool proof requirement missing'
grep -q 'git rebase origin/<target-branch>' docs/GOS3-AGENT-MANIFESTO.md || fail 'Git concurrency protocol missing'
grep -q 'GOS3_EXECUTION_ID' scripts/gos3_agent_proof.sh || fail 'execution receipt gate missing'
grep -q 'GOS3_EVIDENCE_ID' scripts/gos3_agent_proof.sh || fail 'evidence receipt gate missing'
grep -q 'gos3:admit' scripts/gos3_onboard.sh || fail 'admission not mandatory at onboarding'

grep -q 'AgentSandbox.runtimeCheck' tests/gos3_agent_runtime.test.ts || fail 'runtimeCheck behavioral probe missing'
grep -q 'AgentSandbox.executeJavaScript' tests/gos3_agent_runtime.test.ts || fail 'JavaScript behavioral probe missing'
grep -q 'AgentSandbox.executePythonSim' tests/gos3_agent_runtime.test.ts || fail 'Python behavioral probe missing'
grep -q 'AgentSandbox.calculateEnergyBESS' tests/gos3_agent_runtime.test.ts || fail 'tool behavioral probe missing'

if GOS3_EXECUTION_ID='' GOS3_EVIDENCE_ID='' bash scripts/gos3_agent_proof.sh test-agent >/tmp/gos3-proof.out 2>&1; then
  cat /tmp/gos3-proof.out
  fail 'proof accepted without execution/evidence receipt'
fi

grep -q 'BLOCKED' /tmp/gos3-proof.out || fail 'missing BLOCKED result'
ok 'GOS3 Agent Manifesto onboarding contract'
