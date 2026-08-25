#!/usr/bin/env bash
set -euo pipefail

# GOS3 Vortex mandatory onboarding/bootstrap for every human and agent session.
# Safe to run repeatedly. Never changes application source and never prints secrets.

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -n "$ROOT" ]] || { echo '[GOS3][FAIL] run inside the repository' >&2; exit 1; }
cd "$ROOT"

AGENT="${1:-${GOS3_AGENT_ID:-}}"
if [[ "$AGENT" == "--agent" ]]; then AGENT="${2:-}"; fi
if [[ "$AGENT" == --agent=* ]]; then AGENT="${AGENT#*=}"; fi
[[ -n "$AGENT" && "$AGENT" =~ ^[A-Za-z0-9._-]+$ ]] || {
  echo '[GOS3][FAIL] unique agent id required' >&2
  echo 'usage: npm run gos3:onboard -- --agent <id>' >&2
  exit 2
}

for f in docs/GIT-POLICY.md docs/AGENT-TOOLING-POLICY.md scripts/gos3_git_sync.sh scripts/gos3_agent_tooling_check.sh .githooks/pre-push; do
  [[ -f "$f" ]] || { echo "[GOS3][FAIL] missing required protocol file: $f" >&2; exit 3; }
done

git config --local gos3.agentId "$AGENT"
git config --local core.hooksPath .githooks

export GOS3_AGENT_ID="$AGENT"

# Run the read-only onboarding contract after installing local defense-in-depth.
./scripts/gos3_agent_tooling_check.sh

printf '%s\n' \
  '[GOS3][OK] onboarding complete' \
  "[GOS3][OK] agent=$AGENT" \
  '[GOS3][OK] core.hooksPath=.githooks' \
  '[GOS3][OK] publication requires isolated GOS3 worktree' \
  '[GOS3][OK] direct main/force/non-fast-forward publication is denied' \
  '[GOS3][OK] next step: npm run gos3:sync -- <feature-branch>'
