#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
SYNC="$ROOT/scripts/gos3_git_sync.sh"
POLICY="$ROOT/docs/GIT-POLICY.md"
ONBOARD="$ROOT/scripts/gos3_agent_tooling_check.sh"

[[ -f "$SYNC" ]] || { echo 'FAIL: concurrency gate missing'; exit 1; }
[[ -f "$POLICY" ]] || { echo 'FAIL: concurrency policy missing'; exit 1; }
[[ -f "$ONBOARD" ]] || { echo 'FAIL: onboarding check missing'; exit 1; }

# Static safety contract: dangerous recovery/publication paths must not exist.
if grep -Eq 'git push .*--force|git push -f|--ignore-other-worktrees|worktree add --force' "$SYNC"; then
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
  'Direct --push main' ; do
  # Last item is represented semantically in the script; handle separately below.
  if [[ "$needle" == 'Direct --push main' ]]; then continue; fi
  grep -Fq "$needle" "$SYNC" || { echo "FAIL: missing concurrency invariant: $needle"; exit 1; }
done

grep -Fq 'BRANCH" != "main"' "$SYNC" || { echo 'FAIL: main safety guard missing'; exit 1; }
grep -Fq 'branch already owned by another worktree' "$SYNC" || { echo 'FAIL: worktree ownership guard missing'; exit 1; }
grep -Fq 'GOS3_AGENT_ID' "$ONBOARD" || { echo 'FAIL: onboarding identity gate missing'; exit 1; }
grep -Fq 'gos3:sync' "$ONBOARD" || { echo 'FAIL: onboarding sync gate missing'; exit 1; }
grep -Fq 'CAS' "$POLICY" || { echo 'FAIL: CAS policy missing'; exit 1; }
grep -Fq 'New agents' "$POLICY" || { echo 'FAIL: new-agent policy missing'; exit 1; }

echo 'PASS: GOS3 Git concurrency safety contract'
