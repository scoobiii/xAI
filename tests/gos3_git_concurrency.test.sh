#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
SYNC="$ROOT/scripts/gos3_git_sync.sh"
POLICY="$ROOT/docs/GIT-POLICY.md"
ONBOARD="$ROOT/scripts/gos3_agent_tooling_check.sh"
BOOTSTRAP="$ROOT/scripts/gos3_onboard.sh"
HOOK="$ROOT/.githooks/pre-push"

[[ -f "$SYNC" ]] || { echo 'FAIL: concurrency gate missing'; exit 1; }
[[ -f "$POLICY" ]] || { echo 'FAIL: concurrency policy missing'; exit 1; }
[[ -f "$ONBOARD" ]] || { echo 'FAIL: onboarding check missing'; exit 1; }
[[ -f "$BOOTSTRAP" ]] || { echo 'FAIL: mandatory onboarding bootstrap missing'; exit 1; }
[[ -f "$HOOK" ]] || { echo 'FAIL: pre-push safety hook missing'; exit 1; }

# Static safety contract: dangerous recovery/publication paths must not exist.
if grep -Eq 'git push .*--force|git push -f|--ignore-other-worktrees|worktree add --force' "$SYNC" "$HOOK"; then
  echo 'FAIL: unsafe force/override Git operation found'
  exit 1
fi

for needle in \
  'GOS3_AGENT_ID' \
  'git worktree' \
  'EXPECTED_REMOTE_SHA' \
  'ACTUAL_REMOTE_SHA' \
  'git fetch --prune' \
  'rebase' \
  'retry' \
  'stash-pop automation is intentionally disabled' \
  'BRANCH" != "main"'; do
  grep -Fq "$needle" "$SYNC" || { echo "FAIL: missing concurrency invariant: $needle"; exit 1; }
done

grep -Fq 'remote branch moved; refusing non-fast-forward publication' "$HOOK" || { echo 'FAIL: non-fast-forward guard missing'; exit 1; }
grep -Fq 'push to main is prohibited' "$HOOK" || { echo 'FAIL: main push guard missing'; exit 1; }
grep -Fq 'isolated worktree' "$HOOK" || { echo 'FAIL: isolated worktree publication guard missing'; exit 1; }
grep -Fq 'core.hooksPath' "$BOOTSTRAP" || { echo 'FAIL: hook installation missing'; exit 1; }
grep -Fq 'gos3.agentId' "$BOOTSTRAP" || { echo 'FAIL: persistent agent identity missing'; exit 1; }
grep -Fq 'GOS3_AGENT_ID' "$ONBOARD" || { echo 'FAIL: onboarding identity gate missing'; exit 1; }
grep -Fq 'gos3:sync' "$ONBOARD" || { echo 'FAIL: onboarding sync gate missing'; exit 1; }
grep -Fq 'CAS' "$POLICY" || { echo 'FAIL: CAS policy missing'; exit 1; }
grep -Fq 'New agents' "$POLICY" || { echo 'FAIL: new-agent policy missing'; exit 1; }

echo 'PASS: GOS3 Git concurrency safety contract'
